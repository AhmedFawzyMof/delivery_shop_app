import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.yourapp.id",
  appName: "YourAppName",
  webDir: "dist",
  server: {
    url: "http://192.168.1.8:5173",
    cleartext: true,
    androidScheme: "http",
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
};

export default config;
