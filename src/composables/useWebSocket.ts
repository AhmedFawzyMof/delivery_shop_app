import { ref, onUnmounted } from "vue";

const ws = ref<WebSocket | null>(null);
const isConnected = ref(false);
const messages = ref<any[]>([]);

export function useWebRestaurantSocket(
  restaurantId: number,
  restaurantLocation: { lat: number; lng: number } | string
) {
  function connect() {
    ws.value = new WebSocket("ws://localhost:3000");
    const location = ref({ lat: 0, lng: 0 });

    if (typeof restaurantLocation === "string") {
      location.value = JSON.parse(restaurantLocation);
    } else {
      location.value = restaurantLocation;
    }
    ws.value.onopen = () => {
      isConnected.value = true;
      console.log("✅ WebSocket connected");
      ws.value?.send(
        JSON.stringify({
          restaurant_id: restaurantId,
          restaurant_location: location.value,
        })
      );
    };

    ws.value.onmessage = (event) => {
      const data = JSON.parse(event.data);
      messages.value.push(data);
      console.log("📩 New message:", data);
    };

    ws.value.onclose = () => {
      isConnected.value = false;
      console.warn("❌ WebSocket disconnected, reconnecting...");
      setTimeout(connect, 3000); // auto-reconnect
    };

    ws.value.onerror = (err) => {
      console.error("WebSocket error:", err);
      ws.value?.close();
    };
  }

  connect();

  onUnmounted(() => ws.value?.close());

  const sendMessage = (data: object) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(data));
    }
  };

  return { ws, isConnected, messages, sendMessage };
}
