// composables/useDriverTracker.ts
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useOrdersStore } from "@/stores/orders";
import { createDriverWebSocket } from "@/services/websocket";
import { useDriverGeolocation } from "@/services/geolocation";
import {
  setupDriverNotificationChannel,
  showNearbyOrderNotification,
  showOrderUpdatedNotification,
} from "@/services/notifications";
import {
  startDriverForegroundService,
  stopDriverForegroundService,
} from "@/services/foreground";

const WS_URL = "wss://deliveryshop.cloud";

export function useDriverTracker() {
  const authStore = useAuthStore();
  const ordersStore = useOrdersStore();

  const isOnline = ref(true);
  const isConnected = ref(false);
  const lastLocation = ref<{ lat: number; lng: number } | null>(null);
  let heartbeat: any = null;

  const geo = useDriverGeolocation();
  const ws = createDriverWebSocket(WS_URL);

  function connect() {
    ws.connect(handleOpen, handleMessage, handleClose, handleError);
  }

  function handleOpen() {
    isConnected.value = true;
    sendInitialData();
    startHeartbeat();
  }

  function handleClose() {
    isConnected.value = false;
    stopHeartbeat();
    attemptReconnect();
  }

  function handleError() {
    isConnected.value = false;
    stopHeartbeat();
    attemptReconnect();
  }

  function handleMessage(event: MessageEvent) {
    const data = JSON.parse(event.data);

    if (data.type === "new_order_nearby") {
      showNearbyOrderNotification(data.order);
      ordersStore.addOrder(data.order);
    }

    if (data.type === "order_status_updated") {
      if (data.order_status === "ready") {
        showOrderUpdatedNotification(data.order_id);
      }
    }
  }

  function attemptReconnect() {
    if (!isOnline.value) return;

    setTimeout(() => connect(), 5000);
  }

  async function sendInitialData() {
    if (!lastLocation.value) return;

    ws.send({
      type: "driver_init",
      driver_id: authStore.driver?.driver_id,
      driver_status: "READY",
      location: lastLocation.value,
    });
  }

  function startHeartbeat() {
    if (heartbeat) return;

    heartbeat.value = setInterval(() => {
      if (!lastLocation.value) return;
      ws.send({
        type: "location_update",
        driver_id: authStore.driver?.driver_id,
        location: lastLocation.value,
      });
    }, 30000);
  }

  function stopHeartbeat() {
    clearInterval(heartbeat);
    heartbeat = null;
  }

  async function goOnline() {
    isOnline.value = true;
    await setupDriverNotificationChannel();
    await startDriverForegroundService();

    await geo.start((location, error) => {
      if (error) {
        console.log(error);
        return;
      }
      if (!location) return;

      lastLocation.value = {
        lat: location?.latitude,
        lng: location?.longitude,
      };

      ws.send({
        type: "location_update",
        driver_id: authStore.driver?.driver_id,
        location: lastLocation.value,
        driver_stationed_at: ordersStore.orders[0]?.restaurant_id ?? null,
        driver_orders: ordersStore.orders.map((order) => order.order_id),
        timestamp: Date.now(),
      });
      console.log("📡 LIVE LOCATION SENT:", lastLocation.value);
    });

    connect();
  }

  async function goOffline() {
    isOnline.value = false;
    ws.close();
    stopHeartbeat();

    await geo.stop();
    await stopDriverForegroundService();
  }

  onMounted(() => goOnline());
  onBeforeUnmount(() => goOffline());

  return {
    isOnline,
    isConnected,
    lastLocation,
    goOnline,
    goOffline,
  };
}
