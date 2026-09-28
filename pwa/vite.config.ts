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
});
