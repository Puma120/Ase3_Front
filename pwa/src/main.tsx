import type { RootTag } from "react-native";
import { AppRegistry } from "react-native";
import App from "mobile/src/App";

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
