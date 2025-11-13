import { ref, onUnmounted, type Ref } from "vue";
import { toast } from "vue-sonner";

const WS_URL = "ws://192.168.1.8:3000";

interface RestaurantLocation {
  lat: number;
  lng: number;
}

interface WSMessage {
  type: string;
  [key: string]: any;
}

export function useWebRestaurantSocket(
  restaurantId: number,
  restaurantLocation: string
): {
  ws: Ref<WebSocket | null>;
  isConnected: Ref<boolean>;
  messages: Ref<WSMessage[]>;
  sendMessage: (data: object) => void;
} {
  const ws = ref<WebSocket | null>(null);
  const isConnected = ref(false);
  const messages = ref<WSMessage[]>([]);

  const location: string = restaurantLocation.replace(/\\/g, "");

  function connect() {
    ws.value = new WebSocket(WS_URL);
    const jsonLocation = JSON.parse(location);

    console.log("Trying to connect to WebSocket:", WS_URL);

    ws.value.onopen = () => {
      isConnected.value = true;
      ws.value?.send(
        JSON.stringify({
          type: "register_restaurant",
          restaurant_id: restaurantId,
          restaurant_location: jsonLocation,
        })
      );
    };

    ws.value.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data);
        messages.value.push(data);
        console.log("📩 New message:", data);
      } catch (err) {
        console.error("⚠️ Failed to parse WebSocket message:", event.data, err);
      }
    };

    ws.value.onclose = () => {
      isConnected.value = false;
      console.warn("❌ WebSocket disconnected. Reconnecting in 3s...");
      toast.warning("WebSocket disconnected. Reconnecting...");
      setTimeout(connect, 3000);
    };

    ws.value.onerror = (err) => {
      console.error("WebSocket error:", err);
      toast.error("WebSocket connection failed. Check server status.");
      ws.value?.close();
    };
  }

  connect();

  onUnmounted(() => ws.value?.close());

  const sendMessage = (data: object) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(data));
    } else {
      console.warn("⚠️ WebSocket not connected. Cannot send message:", data);
      toast.warning("Cannot send message. WebSocket not connected.");
    }
  };

  return { ws, isConnected, messages, sendMessage };
}
