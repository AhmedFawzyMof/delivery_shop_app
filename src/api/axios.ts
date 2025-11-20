import axios from "axios";

export const baseUrl = "https://deliveryshop.cloud/api";

const api = axios.create({
  baseURL: baseUrl,
});

export default api;
