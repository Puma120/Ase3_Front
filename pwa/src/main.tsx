import type { RootTag } from "react-native";
import { AppRegistry } from "react-native";
import "@fontsource/atkinson-hyperlegible-next/400.css";
import "@fontsource/atkinson-hyperlegible-next/500.css";
import "@fontsource/atkinson-hyperlegible-next/600.css";
import "@fontsource/atkinson-hyperlegible-next/700.css";
import "@fontsource/atkinson-hyperlegible-next/800.css";
import "@fontsource/atkinson-hyperlegible-mono/500.css";
import "@fontsource/atkinson-hyperlegible-mono/700.css";
import { createRoot } from "react-dom/client";
import App from "mobile/src/App";
import InstallBar from "./InstallBar";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('No se encontro el elemento #root en index.html');
}

// Same registration entry point Expo uses natively
// (front/mobile/index.ts), so App.tsx runs unmodified on the web target.
// @types/react-native declara RootTag como symbol opaco, pero en runtime
// react-native-web espera el HTMLElement real — mismatch de tipos conocido
// entre ambos paquetes, no un bug de este codigo.
AppRegistry.registerComponent("App", () => App);
AppRegistry.runApplication("App", {
  rootTag: rootElement as unknown as RootTag,
  initialProps: {},
});

// Barra de descarga (PWA instalable + APK), fuera del arbol de la app movil.
const installRoot = document.getElementById("install-root");
if (installRoot) {
  createRoot(installRoot).render(<InstallBar />);
}

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
