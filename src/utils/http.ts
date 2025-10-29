import { Capacitor } from "@capacitor/core";

import { CapacitorHttp } from "@capacitor/core";

const baseUrl = "http://localhost:3000";
interface HttpRequestOptions {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  data?: any;
}

export async function httpRequest<T>(options: HttpRequestOptions): Promise<T> {
  if (Capacitor.getPlatform() !== "web") {
    return fetchWebRequest<T>(options);
  }

  return fetchAndroidRequest<T>(options);
}

async function fetchAndroidRequest<T>(options: HttpRequestOptions) {
  const { url, method = "GET", headers = {}, data } = options;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      ...headers,
    },
  };

  if (data && (method === "POST" || method === "PUT")) {
    if (data instanceof FormData) {
      fetchOptions.body = data;
    } else {
      fetchOptions.body = JSON.stringify(data);
    }
  }

  try {
    const response = await CapacitorHttp.request({
      method: method,
      url: baseUrl + url,
      headers: headers,
      data: fetchOptions.body,
    });

    return (await response.data) as T;
  } catch (error) {
    console.error("Fetch request failed:", error);
    throw error;
  }
}

async function fetchWebRequest<T>(options: HttpRequestOptions): Promise<T> {
  const { url, method = "GET", headers = {}, data } = options;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      ...headers,
    },
  };

  if (data && (method === "POST" || method === "PUT")) {
    if (data instanceof FormData) {
      fetchOptions.body = data;
    } else {
      fetchOptions.body = JSON.stringify(data);
    }
  }

  try {
    const uri = baseUrl + url;
    const response = await fetch(uri, fetchOptions);

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
