import { registerPlugin } from "@capacitor/core";
import { useOrdersStore } from "@/stores/orders";
import { useAuthStore } from "@/stores/auth";

const DriverTracker = registerPlugin<any>("DriverTracker");

export function useDriverTracker() {
  const ordersStore = useOrdersStore();
  const authStore = useAuthStore();
  let msgListener: any = null;

  const goOnline = async () => {
    const authStore = useAuthStore();
    const d = authStore.driver;

    if (!d) return false;

    try {
      await DriverTracker.startService({
        driver_id: String(d.driver_id),
        driver_name: d.driver_full_name,
        driver_city: d.driver_city,
        driver_orders: JSON.stringify([]),
        driver_stationed_at: d.stationed_at || -1,
      });

      d.isOnline = true;
      return true;
    } catch (err) {
      console.error("Failed to start service:", err);
      return false;
    }
  };

  const goOffline = async () => {
    try {
      if (msgListener) await msgListener.remove(); // Clean up listener
      await DriverTracker.stopService();
      console.log("Background Service Stopped");
      return true;
    } catch (err) {
      console.error("Failed to stop background tracking:", err);
      return false;
    }
  };

  const initNativeListeners = async () => {
    // Remove existing listener if any to prevent duplicates
    if (msgListener) await msgListener.remove();

    msgListener = await DriverTracker.addListener(
      "onWebsocketMessage",
      (info: { data: string }) => {
        try {
          const message = JSON.parse(info.data);
          switch (message.type) {
            case "new_order_nearby":
              ordersStore.addOrder(message.order);
              break;
            case "order_status_updated":
              ordersStore.updateOrderStatus(message.order_id, message.status);
              break;
            default:
              console.log("Native message:", message);
          }
        } catch (error) {
          console.error("Bridge parse error:", error);
        }
      },
    );
  };

  const changeCity = async (newCity: string) => {
    try {
      // Update local state
      authStore.changeCity(newCity);

      // Update Native Java Layer
      await DriverTracker.updateDriverData({
        driver_city: newCity,
      });
    } catch (err) {
      console.error("Failed to update city in native layer:", err);
    }
  };

  return { goOnline, goOffline, initNativeListeners, changeCity };
}
