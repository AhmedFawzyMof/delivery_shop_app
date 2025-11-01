import { ref } from "vue";
import { defineStore } from "pinia";
import { httpRequest } from "@/utils/http";

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

export const useAuthStore = defineStore("auth", () => {
  const driver = ref<Driver | null>(null);
  const isAuthenticated = ref(false);
  const user = ref<any>(null);
  const type = ref("");
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function login(credentials: Record<string, any>) {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await httpRequest<{ driver: Driver }>({
        url: "/api/auth/driver/login",
        method: "POST",
        data: credentials,
      });
      alert(JSON.stringify(response));
      if (!response || !response.driver)
        throw new Error("Invalid server response");
      driver.value = response.driver;
      type.value = "driver";
      isAuthenticated.value = true;
      return true;
    } catch (err: any) {
      console.error("Login error:", err);
      error.value = err.message || "Login failed";
      isAuthenticated.value = false;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function restaurantlogin(name: string, password: string) {
    const response = await httpRequest<{ user: any }>({
      url: "/api/auth/restaurant/login",
      method: "POST",
      data: {
        restaurant_name: name,
        password,
      },
    });

    user.value = response.user;
    type.value = "restaurant";
    isAuthenticated.value = true;
  }

  async function checkSession() {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await httpRequest<{
        user: { id: number; type: string; shiftDuration: number };
      }>({
        url: "/api/auth/driver",
        method: "GET",
      });
      isAuthenticated.value = !!response?.user?.id;
      type.value = "driver";
      return true;
    } catch (err: any) {
      isAuthenticated.value = false;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function checkRestaurantSession() {
    isLoading.value = true;
    error.value = null;

    const response = await httpRequest<{ user: any }>({
      url: "/api/auth/restaurant",
      method: "GET",
    });

    isAuthenticated.value = !!response?.user?.id;
    type.value = "restaurant";
  }

  async function logout() {
    isLoading.value = true;
    error.value = null;
    try {
      await httpRequest({
        url: "/api/auth/logout",
        method: "POST",
      });
      driver.value = null;
      isAuthenticated.value = false;
      return true;
    } catch (err: any) {
      error.value = err.message || "Logout failed";
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    driver,
    user,
    isAuthenticated,
    isLoading,
    type,
    error,
    restaurantlogin,
    checkRestaurantSession,
    login,
    logout,
    checkSession,
  };
});
