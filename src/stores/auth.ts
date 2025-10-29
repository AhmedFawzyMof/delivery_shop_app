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
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function login(formData: FormData) {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await httpRequest<{ driver: Driver }>({
        url: "/api/auth/driver/login",
        method: "POST",
        data: formData,
      });
      driver.value = response.driver;
      isAuthenticated.value = true;
      return true;
    } catch (err: any) {
      error.value = err.message || "Login failed";
      isAuthenticated.value = false;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function checkSession() {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await httpRequest<{
        user: { id: number; type: string };
      }>({
        url: "/api/auth/driver",
        method: "GET",
      });
      isAuthenticated.value = !!response.user.id;
      return true;
    } catch (err: any) {
      isAuthenticated.value = false;
      return false;
    } finally {
      isLoading.value = false;
    }
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
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    checkSession,
  };
});
