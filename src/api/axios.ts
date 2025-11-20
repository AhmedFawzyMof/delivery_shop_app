import { Preferences } from "@capacitor/preferences";
import axios from "axios";

export const baseUrl = "https://deliveryshop.cloud/api";

const api = axios.create({
  baseURL: baseUrl,
});

api.interceptors.request.use(
  async (config) => {
    try {
      const { value: sessionToken } = await Preferences.get({
        key: "sessionToken",
      });

      if (sessionToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${sessionToken}`;
      }
    } catch (err) {
      console.warn("Failed to load sessionToken from Preferences:", err);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
export default api;
