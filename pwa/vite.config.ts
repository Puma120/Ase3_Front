import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// Aliases "react-native" to "react-native-web" so components written under
// front/mobile/src (imported via the "mobile" workspace) render on the web
// without any code changes — this is the RN-Web parity strategy in
// practice.
export default defineConfig(({ mode }) => {
  // loadEnv lee pwa/.env(.local) ademas de las env vars del shell/Vercel —
  // asi VITE_GATEWAY_URL funciona igual en local que en el build de Vercel.
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return {
    plugins: [react()],
    resolve: {
      alias: [
        { find: /^react-native$/, replacement: "react-native-web" },
        // googleAuth.ts importa expo-web-browser dinamicamente solo para
        // nativo (Platform.OS !== "web"); en la PWA nunca se ejecuta, pero
        // rolldown igual necesita poder resolverlo/bundlearlo — ver stub.
        {
          find: /^expo-web-browser$/,
          replacement: fileURLToPath(
            new URL("./src/stubs/expo-web-browser.ts", import.meta.url),
          ),
        },
      ],
    },
    // apiClient.ts (compartido con front/mobile) lee process.env.EXPO_PUBLIC_GATEWAY_URL.
    // En Vite no existe process.env, asi que lo inyectamos en build time desde VITE_GATEWAY_URL
    // (variable de entorno de Vercel, o pwa/.env en local) sin tocar el codigo compartido con Expo.
    define: {
      "typeof process": JSON.stringify("object"),
      "process.env.EXPO_PUBLIC_GATEWAY_URL": JSON.stringify(
        env.VITE_GATEWAY_URL ?? "",
      ),
    },
  };
});
