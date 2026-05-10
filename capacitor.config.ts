import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.codeconsultings.cromoswapcuenca",
  appName: "CromoSwap Cuenca",
  webDir: "public",
  server: {
    url: "https://cromoswapcuenca.vercel.app",
    cleartext: false
  }
};

export default config;
