import { AppRegistry } from "react-native";
import App from "mobile/src/App";

// Same registration entry point Expo uses natively
// (front/mobile/index.ts), so App.tsx runs unmodified on the web target.
AppRegistry.registerComponent("App", () => App);
AppRegistry.runApplication("App", {
  rootTag: document.getElementById("root"),
});
