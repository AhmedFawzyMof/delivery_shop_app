import { ref } from "vue";
import { defineStore } from "pinia";
import { httpRequest } from "@/utils/http";
import { Preferences } from "@capacitor/preferences";

interface Driver {
  driver_id: number;
  driver_full_name: string;
  driver_phone: string;
  driver_city: string;
  driver_type: string;
  driver_status: string;
  is_baned: boolean;
  stationed_at: number | null;
  id_number: string;
  plate_number: string;
  license_photo: string;
  rate: number | null;
  created_at: string;
}

interface DriverSession extends Driver {
  type: string;
  shiftDuration: number;
}

export const useAuthStore = defineStore("auth", () => {
  const driver = ref<Driver | null>(null);
  const user = ref<any>(null);
  const isAuthenticated = ref(false);
  const type = ref("");
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function init() {
    const { value: token } = await Preferences.get({ key: "sessionToken" });

    if (!token) {
      isAuthenticated.value = false;
      return;
    }

    const okDriver = await checkSession();
    if (!okDriver) {
      const okRestaurant = await checkRestaurantSession();
      if (!okRestaurant) {
        await logout();
      }
    }
  }

  async function login(credentials: Record<string, any>) {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await httpRequest<{
        driver: Driver;
        sessionToken: string;
      }>({
        url: "/api/auth/driver/login",
        method: "POST",
        data: credentials,
      });

      await Preferences.set({
        key: "sessionToken",
        value: response.sessionToken,
      });

      driver.value = response.driver;
      type.value = "driver";
      isAuthenticated.value = true;
      return true;
    } catch (err: any) {
      error.value = err.message;
      isAuthenticated.value = false;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function restaurantlogin(name: string, password: string) {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await httpRequest<{
        user: any;
        sessionToken: string;
      }>({
        url: "/api/auth/restaurant/login",
        method: "POST",
        data: {
          restaurant_name: name,
          password,
        },
      });

      await Preferences.set({
        key: "sessionToken",
        value: response.sessionToken,
      });

      user.value = response.user;
      type.value = "restaurant";
      isAuthenticated.value = true;
      return true;
    } catch (err: any) {
      error.value = err.message;
      isAuthenticated.value = false;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function checkSession() {
    try {
      const response = await httpRequest<{ user: DriverSession }>({
        url: "/api/auth/driver",
        method: "GET",
      });

      if (!response?.user?.driver_id) return false;

      driver.value = response.user;
      type.value = "driver";
      isAuthenticated.value = true;
      return true;
    } catch {
      return false;
    }
  }

  async function checkRestaurantSession() {
    try {
      const response = await httpRequest<{ user: any }>({
        url: "/api/auth/restaurant",
        method: "GET",
      });

      if (!response?.user?.id) return false;

      user.value = response.user;
      type.value = "restaurant";
      isAuthenticated.value = true;
      return true;
    } catch {
      return false;
    }
  }

  async function logout() {
    await httpRequest({
      url: "/api/auth/logout",
      method: "POST",
    });

    await Preferences.remove({ key: "sessionToken" });

    driver.value = null;
    user.value = null;
    isAuthenticated.value = false;
  }

  function setStationedAt(id: number) {
    if (driver.value) driver.value.stationed_at = id;
  }

  return {
    driver,
    user,
    type,
    isAuthenticated,
    isLoading,
    error,
    init,
    login,
    restaurantlogin,
    checkSession,
    checkRestaurantSession,
    logout,
    setStationedAt,
  };
});
