import { ref, onBeforeUnmount, onMounted } from "vue";
import { ForegroundService } from "@capawesome-team/capacitor-android-foreground-service";
import { LocalNotifications } from "@capacitor/local-notifications";
import { useAuthStore } from "@/stores/auth";
import { useOrdersStore } from "@/stores/orders";
import type {
  BackgroundGeolocationPlugin,
  Location,
} from "@capacitor-community/background-geolocation";
import { registerPlugin } from "@capacitor/core";
import { toast } from "vue-sonner";

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>(
  "BackgroundGeolocation"
);

const WS_URL = "ws://185.97.144.106:8080";
const LOCATION_INTERVAL = 30000;
const MAX_RECONNECT_ATTEMPTS = 3;

type ConnectionTypes = "driver_init" | "location_update" | "update_orders";

type SimpleLocation = {
  lat: number;
  lng: number;
};

type DriverConnection = {
  type: ConnectionTypes;
  driver_id?: number;
  driver_name?: string;
  driver_type?: string;
  driver_city?: string;
  location?: SimpleLocation;
  driver_status?: string;
  driver_stationed_at?: any;
  driver_orders?: number[];
  timestamp?: number;
};

export function useDriverTracker() {
  const authStore = useAuthStore();
  const ordersStore = useOrdersStore();
  const driver = authStore.driver;
  const isOnline = ref(true);
  const isConnected = ref(true);
  const lastLocation = ref<{ lat: number; lng: number } | null>(null);

  let ws: WebSocket | null = null;
  let locationInterval: ReturnType<typeof setInterval> | null = null;
  let watcherId: string | null = null;

  async function requestPermissions() {
    const permResult = await LocalNotifications.requestPermissions();

    if (permResult.display !== "granted") {
      console.log("⚠️ Notifications permission not granted");
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
        sound: "order_sound",
        vibration: true,
        visibility: 1,
      });
      console.log("✅ Notification channel ready");
    } catch (err) {
      console.error("❌ Failed to create notification channel:", err);
    }
  }

  function showOrderNotification(order: any) {
    const notificationId = Math.floor(Math.random() * 1000000);
    setTimeout(() => {
      LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title: "📦 طلب جديد قريب منك",
            body: `الطلب من ${order.restaurant.name}`,
            channelId: "orders_channel",
            smallIcon: "ic_launcher",
            sound: "order_sound",
            schedule: {
              allowWhileIdle: true,
            },
          },
        ],
      }).catch((err) =>
        alert(`❌ Notification failed:, ${JSON.stringify(err.message)}`)
      );
    }, 1000);
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
      sendInitialData(lastLocation.value);
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
          showOrderNotification(data.order);
          sendUpdateOrdersWs(data.order.order_id, data.order.restaurant_id);
          ordersStore.addOrder(data.order);
          authStore.setStationedAt(data.order.restaurant_id);
          toast.success("📦 طلب جديد قريب منك");
        }

        if (data.type === "updated_order") {
          ordersStore.updateOrder(data.order);
        }

        if (data.type === "order_status_updated") {
          if (data.order_status === "delivered") {
            ordersStore.removeOrder(data.order_id);
            sendFreeDriverWs();
            return;
          }
          ordersStore.updateOrderStatus(data.order_id, data.order_status);
        }
      } catch (err) {
        console.error("❌ Failed to handle WS message:", err);
      }
    };
  }

  function reconnectWebSocket() {
    console.log("Attempting to reconnect...");
    setTimeout(() => {
      if (isOnline.value) connectWebSocket();
    }, 5000);
  }

  function sendUpdateOrdersWs(order_id: number, restaurant_id: number) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(
      JSON.stringify({
        type: "update_orders",
        driver_id: driver?.driver_id,
        driver_stationed_at: restaurant_id,
        driver_status: "PICKING_UP",
        order_id: order_id,
      })
    );
  }

  function sendFreeDriverWs() {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(
      JSON.stringify({
        type: "free_driver",
        driver_id: driver?.driver_id,
        driver_stationed_at: ordersStore.orders[0]?.restaurant_id ?? null,
        driver_orders: ordersStore.orders.map((order) => order.order_id),
        driver_status: "READY",
      })
    );
  }

  function sendInitialData(location?: { lat: number; lng: number } | null) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const data: Partial<DriverConnection> = {
      type: "driver_init",
      driver_id: driver?.driver_id,
      driver_name: driver?.driver_full_name,
      driver_type: "driver",
      driver_city: driver?.driver_city,
      driver_status: "READY",
      driver_stationed_at: ordersStore.orders[0]?.restaurant_id ?? null,
      driver_orders: ordersStore.orders.map((order) => order.order_id),
    };

    if (location) {
      Object.assign(data, { location });
    }

    ws.send(JSON.stringify(data));
  }

  function startLocationInterval() {
    stopLocationInterval();
    locationInterval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN && lastLocation.value) {
        const data: Partial<DriverConnection> = {
          type: "location_update",
          driver_id: authStore.driver?.driver_id,
          location: lastLocation.value,
          driver_stationed_at: ordersStore?.orders[0]?.restaurant_id ?? null,
          driver_orders: ordersStore?.orders.map((order) => order.order_id),
          timestamp: Date.now(),
        };
        ws.send(JSON.stringify(data));
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
