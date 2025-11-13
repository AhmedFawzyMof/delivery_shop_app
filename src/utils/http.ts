import { Capacitor } from "@capacitor/core";

import { CapacitorHttp } from "@capacitor/core";

const baseUrl = "https://deliveryshop.webmadeeasy.online";
interface HttpRequestOptions {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  data?: any;
}

export async function httpRequest<T>(options: HttpRequestOptions): Promise<T> {
  if (Capacitor.getPlatform() === "web") {
    return fetchWebRequest<T>(options);
  }

  if (Capacitor.getPlatform() === "android") {
    return fetchAndroidRequest<T>(options);
  }

  throw new Error("Unsupported platform");
}

async function fetchAndroidRequest<T>(options: HttpRequestOptions) {
  const { url, method = "GET", headers = {}, data } = options;

  try {
    const response = await CapacitorHttp.request({
      method,
      url: baseUrl + url,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      data,
    });

    if (!response || !response.data) {
      throw new Error("No response data received");
    }

    return response.data as T;
  } catch (error) {
    console.error("Capacitor HTTP error:", error);
    throw error;
  }
}

async function fetchWebRequest<T>(options: HttpRequestOptions): Promise<T> {
  const { url, method = "GET", headers = {}, data } = options;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "include", // if your server uses cookies/session
  };

  if (data && (method === "POST" || method === "PUT")) {
    fetchOptions.body = data instanceof FormData ? data : JSON.stringify(data);
  }

  try {
    const response = await fetch(baseUrl + url, fetchOptions);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      throw new Error(
        `HTTP error! Status: ${response.status}, Message: ${errorData.message}`
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error("Fetch request failed:", error);
    throw error;
  }
}
