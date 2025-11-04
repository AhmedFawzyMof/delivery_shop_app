import { ref, onBeforeUnmount, onMounted } from "vue";
import { ForegroundService } from "@capawesome-team/capacitor-android-foreground-service";
import { LocalNotifications } from "@capacitor/local-notifications";
import { useAuthStore } from "@/stores/auth";
import type {
  BackgroundGeolocationPlugin,
  Location,
} from "@capacitor-community/background-geolocation";
import { registerPlugin } from "@capacitor/core";
import { toast } from "vue-sonner";

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>(
  "BackgroundGeolocation"
);

const WS_URL = "ws://192.168.1.8:3000";
const LOCATION_INTERVAL = 30000;

export function useDriverTracker() {
  const authStore = useAuthStore();
  const driver = authStore.driver;
  const isOnline = ref(true);
  const isConnected = ref(true);
  const lastLocation = ref<{ lat: number; lng: number } | null>(null);

  let ws: WebSocket | null = null;
  let locationInterval: ReturnType<typeof setInterval> | null = null;
  let watcherId: string | null = null;

  async function requestPermissions() {
    const permResult = await LocalNotifications.requestPermissions();
    alert(JSON.stringify(permResult));
    if (permResult.display !== "granted") {
      alert("⚠️ Notifications permission not granted");
    } else {
      console.log("✅ Notifications permission granted");
    }
  }

  async function setupNotificationChannel() {
    try {
      await LocalNotifications.createChannel({
        id: "orders_channel",
        name: "Orders Notifications",
        description: "Channel for nearby order alerts",
        importance: 5,
        sound: "default",
        vibration: true,
        visibility: 1,
      });
      console.log("✅ Notification channel ready");
    } catch (err) {
      console.error("❌ Failed to create notification channel:", err);
    }
  }

  async function startForegroundService() {
    try {
      await ForegroundService.startForegroundService({
        id: 101,
        title: "Delivery Shop",
        body: "في انتظار الطلبات الجديدة ...",
        smallIcon: "ic_launcher_foreground",
      });
      console.log("✅ Foreground service started");
    } catch (err) {
      console.error("❌ Foreground service failed:", err);
    }
  }

  async function stopForegroundService() {
    try {
      await ForegroundService.stopForegroundService();
      console.log("🛑 Foreground service stopped");
    } catch (err) {
      console.error("❌ Failed to stop foreground service:", err);
    }
  }

  async function startGeolocation() {
    try {
      const result = await BackgroundGeolocation.addWatcher(
        {
          backgroundMessage: "في انتظار الطلبات الجديدة.",
          backgroundTitle: "تتبع الطلبات",
          requestPermissions: true,
          stale: false,
          distanceFilter: 50,
        },
        (location: Location | undefined, error?: any) => {
          if (error) {
            console.error("❌ Location error:", error);
            return;
          }
          lastLocation.value = {
            lat: location?.latitude!,
            lng: location?.longitude!,
          };
          console.log("📍 Location update:", lastLocation.value);
        }
      );

      watcherId = result;
      console.log("✅ Geolocation watcher started");
    } catch (err) {
      console.error("❌ Geolocation failed:", err);
    }
  }

  async function stopGeolocation() {
    try {
      if (watcherId) {
        await BackgroundGeolocation.removeWatcher({ id: watcherId });
        watcherId = null;
      }
      console.log("🛑 Geolocation stopped");
    } catch (err) {
      console.error("❌ Failed to stop geolocation:", err);
    }
  }

  function connectWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) return;

    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log("✅ WS connected");
      isConnected.value = true;
      sendInitialData();
    };

    ws.onclose = () => {
      console.log("❌ WS closed");
      isConnected.value = false;
      reconnectWebSocket();
    };

    ws.onerror = (err) => {
      console.error("❌ WS error:", err);
      isConnected.value = false;
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_order_nearby") {
          console.log("🆕 New nearby order:", data.order);

          await LocalNotifications.schedule({
            notifications: [
              {
                title: "📦 طلب جديد قريب منك",
                body: `الطلب من ${data.order.restaurant_name} - ${data.order.distance.toFixed(1)} كم`,
                id: Date.now(),
                channelId: "orders_channel",
                sound: "default",
                smallIcon: "ic_launcher",
                schedule: { at: new Date(Date.now() + 1000) },
              },
            ],
          });

          window.dispatchEvent(
            new CustomEvent("new-order", { detail: data.order })
          );
        }
      } catch (err) {
        console.error("❌ Failed to handle WS message:", err);
      }
    };
  }

  function reconnectWebSocket() {
    setTimeout(() => {
      if (isOnline.value) connectWebSocket();
    }, 5000);
  }

  function sendInitialData() {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(
      JSON.stringify({
        type: "driver_init",
        driver_id: driver?.driver_id,
        driver_name: driver?.driver_full_name,
        driver_type: "driver",
        driver_city: driver?.driver_city,
      })
    );
  }

  function startLocationInterval() {
    stopLocationInterval();
    locationInterval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN && lastLocation.value) {
        ws.send(
          JSON.stringify({
            type: "location_update",
            driver_id: authStore.driver?.driver_id,
            driver_name: authStore.driver?.driver_full_name,
            driver_type: authStore.driver?.driver_type,
            location: lastLocation.value,
            timestamp: Date.now(),
          })
        );
        console.log("📡 Sent location:", lastLocation.value);
      }
    }, LOCATION_INTERVAL);
  }

  function stopLocationInterval() {
    if (locationInterval) clearInterval(locationInterval);
    locationInterval = null;
  }

  async function goOnline() {
    isOnline.value = true;
    await requestPermissions();
    await setupNotificationChannel();
    await startForegroundService();
    await startGeolocation();
    connectWebSocket();
    startLocationInterval();
  }

  async function goOffline() {
    isOnline.value = false;
    stopLocationInterval();
    if (ws) ws.close(1000, "Driver offline");
    ws = null;
    await stopForegroundService();
    await stopGeolocation();
  }

  onBeforeUnmount(() => {
    goOffline();
  });

  onMounted(() => {
    goOnline();
  });

  return {
    isOnline,
    isConnected,
    driver,
    lastLocation,
    goOnline,
    goOffline,
  };
}
