<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { LocalNotifications } from "@capacitor/local-notifications";
import { App } from "@capacitor/app";
import { useAuthStore } from "@/stores/auth";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Check, XCircle, Wifi, WifiOff, Bell, BellOff } from "lucide-vue-next";

const authStore = useAuthStore();
const isOnline = ref(false);
const isConnected = ref(false);
const connectionStatus = ref<string>("غير متصل");
const lastMessageTime = ref<string>("");
const receivedOrdersCount = ref(0);
const WEBSOCKET_URL = "ws://192.168.1.8:3000";
const RECONNECT_INTERVAL = 5000;
const MAX_RECONNECT_ATTEMPTS = 999;
const HEARTBEAT_INTERVAL = 30000;

let ws: WebSocket | null = null;
let reconnectAttempts = 0;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let missedHeartbeats = 0;
const MAX_MISSED_HEARTBEATS = 3;

function enableBackgroundMode() {
  try {
    const backgroundMode = (window as any).cordova?.plugins?.backgroundMode;

    if (!backgroundMode) {
      console.warn("⚠️ Background mode plugin not available");
      showNotification("خطأ", "خاصية العمل في الخلفية غير متوفرة", "danger");
      return false;
    }

    backgroundMode.setDefaults({
      title: "Delivery Shop",
      text: "متصل - في انتظار الطلبات الجديدة",
      icon: "icon",
      color: "#10B981",
      resume: true,
      hidden: false,
      bigText: false,
      silent: true,
    });

    backgroundMode.enable();

    backgroundMode.disableBatteryOptimizations();

    backgroundMode.disableWebViewOptimizations();

    backgroundMode.setEnabled(true);

    console.log("✅ Background mode enabled");
    return true;
  } catch (err) {
    console.error("❌ Error enabling background mode:", err);
    return false;
  }
}

function disableBackgroundMode() {
  try {
    const backgroundMode = (window as any).cordova?.plugins?.backgroundMode;
    if (backgroundMode) {
      backgroundMode.disable();
      console.log("🛑 Background mode disabled");
    }
  } catch (err) {
    console.error("❌ Error disabling background mode:", err);
  }
}

function updateBackgroundNotification(status: string) {
  try {
    const backgroundMode = (window as any).cordova?.plugins?.backgroundMode;
    if (backgroundMode && backgroundMode.isEnabled()) {
      backgroundMode.configure({
        text: status,
      });
    }
  } catch (err) {
    console.error("Failed to update background notification:", err);
  }
}

async function showNotification(
  title: string,
  message: string,
  type: "success" | "warning" | "danger" = "warning"
) {
  console.log(`[${type.toUpperCase()}] ${title}: ${message}`);

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now(),
          title: title,
          body: message,
          sound: type === "danger" ? "default" : undefined,
        },
      ],
    });
  } catch (err) {
    console.warn("Failed to show notification:", err);
  }
}

function startHeartbeat() {
  stopHeartbeat();

  heartbeatInterval = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(
          JSON.stringify({
            type: "ping",
            timestamp: Date.now(),
            userId: authStore.user?.id,
          })
        );

        missedHeartbeats++;

        if (missedHeartbeats >= MAX_MISSED_HEARTBEATS) {
          console.warn("⚠️ Too many missed heartbeats, reconnecting...");
          connectionStatus.value = "إعادة الاتصال...";
          ws.close();
          missedHeartbeats = 0;
        }
      } catch (err) {
        console.error("❌ Error sending heartbeat:", err);
      }
    }
  }, HEARTBEAT_INTERVAL);
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  missedHeartbeats = 0;
}

function connectWebSocket() {
  if (
    ws &&
    (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
  ) {
    console.log("WebSocket already connected or connecting");
    return;
  }

  if (!isOnline.value) {
    console.log("User is offline, skipping connection");
    return;
  }

  reconnectAttempts++;
  connectionStatus.value = `جاري الاتصال... (محاولة ${reconnectAttempts})`;
  console.log(`🔄 Connecting to WebSocket (Attempt ${reconnectAttempts})...`);

  try {
    ws = new WebSocket(WEBSOCKET_URL);

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
      isConnected.value = true;
      connectionStatus.value = "متصل ✓";
      reconnectAttempts = 0;
      missedHeartbeats = 0;

      updateBackgroundNotification("متصل - في انتظار الطلبات");
      showNotification("نجح الاتصال", "تم الاتصال بالخادم بنجاح", "success");

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }

      startHeartbeat();

      if (authStore.user?.id) {
        ws?.send(
          JSON.stringify({
            type: "auth",
            userId: authStore.user.id,
            timestamp: Date.now(),
          })
        );
      }
    };

    ws.onclose = (event) => {
      console.log(
        `❌ WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`
      );
      isConnected.value = false;
      connectionStatus.value = "منقطع الاتصال";
      stopHeartbeat();

      const intentionalClose = event.code === 1000 || !isOnline.value;

      if (isOnline.value && !intentionalClose && !reconnectTimeout) {
        const delay = Math.min(RECONNECT_INTERVAL * reconnectAttempts, 30000);
        connectionStatus.value = `إعادة الاتصال بعد ${delay / 1000} ثانية...`;
        updateBackgroundNotification(`إعادة الاتصال...`);

        reconnectTimeout = setTimeout(() => {
          connectWebSocket();
        }, delay);
      }
    };

    ws.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
      connectionStatus.value = "خطأ في الاتصال";
      stopHeartbeat();
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        lastMessageTime.value = new Date().toLocaleTimeString("ar-EG");

        console.log("📨 Message received:", data);

        if (data.type === "pong") {
          missedHeartbeats = 0;
          return;
        }

        if (data.type === "new_order") {
          receivedOrdersCount.value++;

          console.log("🛵 New order received:", data);

          if (navigator.vibrate) {
            navigator.vibrate([300, 100, 300, 100, 300]);
          }

          await LocalNotifications.schedule({
            notifications: [
              {
                id: Date.now(),
                title: "🛵 طلب جديد!",
                body: `طلب رقم #${data.order_id || "N/A"}`,
                largeBody: data.customer_name
                  ? `العميل: ${data.customer_name}\nالعنوان: ${data.address || "غير محدد"}`
                  : "انقر لعرض التفاصيل",
                summaryText: "طلب توصيل جديد",
                sound: "default",
                channelId: "delivery_orders",
                extra: {
                  orderId: data.order_id,
                  orderData: JSON.stringify(data),
                },
              },
            ],
          });

          updateBackgroundNotification(`طلب جديد #${data.order_id}`);

          setTimeout(() => {
            updateBackgroundNotification("متصل - في انتظار الطلبات");
          }, 10000);
        }

        if (data.type === "order_update") {
          console.log("📝 Order update:", data);
          await LocalNotifications.schedule({
            notifications: [
              {
                id: Date.now(),
                title: "تحديث الطلب",
                body: `تم تحديث حالة الطلب #${data.order_id}`,
                sound: undefined,
                channelId: "delivery_orders",
              },
            ],
          });
        }
      } catch (err) {
        console.error("❌ Error parsing message:", err);
      }
    };
  } catch (err) {
    console.error("❌ Failed to create WebSocket:", err);
    connectionStatus.value = "فشل الاتصال";
  }
}

async function startListening() {
  try {
    const permResult = await LocalNotifications.requestPermissions();
    if (permResult.display !== "granted") {
      showNotification("تحذير", "يجب منح إذن الإشعارات للتطبيق", "warning");
      isOnline.value = false;
      return;
    }

    try {
      await LocalNotifications.createChannel({
        id: "delivery_orders",
        name: "طلبات التوصيل",
        description: "إشعارات الطلبات الجديدة والتحديثات",
        importance: 5,
        visibility: 1,
        sound: "default",
        vibration: true,
      });
    } catch (e) {
      console.log("Channel may already exist");
    }

    const bgEnabled = enableBackgroundMode();
    if (!bgEnabled) {
      showNotification("خطأ", "فشل تفعيل وضع الخلفية", "danger");
      isOnline.value = false;
      return;
    }

    connectWebSocket();

    console.log("✅ Started listening for orders");
  } catch (err) {
    console.error("❌ Error starting listener:", err);
    showNotification("خطأ", "فشل في بدء الخدمة", "danger");
    isOnline.value = false;
  }
}

async function stopListening() {
  try {
    console.log("🛑 Stopping listener...");

    disableBackgroundMode();

    stopHeartbeat();

    if (ws) {
      ws.close(1000, "User stopped listening");
      ws = null;
    }

    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    isConnected.value = false;
    connectionStatus.value = "غير متصل";
    reconnectAttempts = 0;

    console.log("✅ Stopped listening");
    showNotification("تم الإيقاف", "تم إيقاف خدمة الاستماع للطلبات", "warning");
  } catch (err) {
    console.error("❌ Error stopping listener:", err);
  }
}

const handleAppStateChange = (state: { isActive: boolean }) => {
  console.log(`📱 App state: ${state.isActive ? "FOREGROUND" : "BACKGROUND"}`);

  if (state.isActive && isOnline.value) {
    console.log("📱 App resumed - checking connection...");

    if (!isConnected.value || ws?.readyState !== WebSocket.OPEN) {
      console.log("🔄 Reconnecting WebSocket...");
      connectWebSocket();
    }
  } else if (!state.isActive && isOnline.value) {
    console.log("📱 App in background - connection maintained");
  }
};

watch(isOnline, async (newValue) => {
  if (newValue) {
    console.log("🟢 Going online...");
    await startListening();
  } else {
    console.log("🔴 Going offline...");
    await stopListening();
  }
});

onMounted(() => {
  console.log("🚀 Component mounted");

  App.addListener("appStateChange", handleAppStateChange);

  LocalNotifications.addListener(
    "localNotificationActionPerformed",
    (notification) => {
      console.log("🔔 Notification tapped:", notification);

      if (notification.notification.extra?.orderId) {
        const orderId = notification.notification.extra.orderId;
        console.log("📦 Opening order:", orderId);
      }
    }
  );

  console.log("✅ Listeners registered");
});

onBeforeUnmount(() => {
  console.log("🧹 Cleaning up...");

  stopListening();

  App.removeAllListeners();
  LocalNotifications.removeAllListeners();

  console.log("✅ Cleanup complete");
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-4">
    <Card class="max-w-md mx-auto">
      <CardHeader>
        <CardTitle class="text-2xl text-center"> 🛵 Delivery Shop </CardTitle>
        <p class="text-center text-sm text-gray-500">نظام استقبال الطلبات</p>
      </CardHeader>

      <CardContent class="space-y-6">
        <!-- Online/Offline Toggle -->
        <div
          class="flex items-center justify-between p-4 bg-white rounded-lg border"
        >
          <div class="flex items-center gap-3">
            <component
              :is="isOnline ? Bell : BellOff"
              :class="isOnline ? 'text-green-600' : 'text-gray-400'"
              class="w-6 h-6"
            />
            <div>
              <Label class="text-base font-semibold">
                {{ isOnline ? "متصل" : "غير متصل" }}
              </Label>
              <p class="text-xs text-gray-500">
                {{
                  isOnline ? "استقبال الطلبات مفعل" : "استقبال الطلبات متوقف"
                }}
              </p>
            </div>
          </div>
          <Switch :checked="isOnline" @update:checked="isOnline = $event" />
        </div>

        <!-- Connection Status -->
        <div class="p-4 bg-white rounded-lg border space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">حالة الاتصال:</span>
            <Badge
              :variant="isConnected ? 'default' : 'secondary'"
              class="flex items-center gap-1"
            >
              <component :is="isConnected ? Wifi : WifiOff" class="w-3 h-3" />
              {{ connectionStatus }}
            </Badge>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">آخر رسالة:</span>
            <span class="text-sm text-gray-500">
              {{ lastMessageTime || "لا توجد" }}
            </span>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700"
              >الطلبات المستلمة:</span
            >
            <Badge variant="outline">
              {{ receivedOrdersCount }}
            </Badge>
          </div>
        </div>

        <!-- Status Indicator -->
        <div
          v-if="isOnline"
          class="p-4 rounded-lg border-2"
          :class="
            isConnected
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
          "
        >
          <div class="flex items-center gap-2">
            <component
              :is="isConnected ? Check : XCircle"
              :class="isConnected ? 'text-green-600' : 'text-yellow-600'"
              class="w-5 h-5"
            />
            <p class="text-sm font-medium">
              {{
                isConnected
                  ? "جاهز لاستقبال الطلبات"
                  : "جاري الاتصال بالخادم..."
              }}
            </p>
          </div>
        </div>

        <!-- Info -->
        <div class="text-xs text-gray-500 text-center space-y-1">
          <p>• سيتم استقبال الطلبات حتى عند إغلاق التطبيق</p>
          <p>• تأكد من تفعيل الإشعارات في إعدادات الجهاز</p>
          <p>• يرجى عدم إيقاف التطبيق من مدير المهام</p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
