import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Aliases "react-native" to "react-native-web" so components written under
// front/mobile/src (imported via the "mobile" workspace) render on the web
// without any code changes — this is the RN-Web parity strategy in
// practice.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: /^react-native$/, replacement: "react-native-web" }],
  },
  // apiClient.ts (compartido con front/mobile) lee process.env.EXPO_PUBLIC_GATEWAY_URL.
  // En Vite no existe process.env, asi que lo inyectamos en build time desde VITE_GATEWAY_URL
  // (variable de entorno de Vercel) sin tocar el codigo compartido con Expo.
  define: {
    "typeof process": JSON.stringify("object"),
    "process.env.EXPO_PUBLIC_GATEWAY_URL": JSON.stringify(
      process.env.VITE_GATEWAY_URL ?? "",
    ),
  },
});
