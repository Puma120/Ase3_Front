import { registerRootComponent } from "expo";

import App from "./src/App";
import "./src/native/location"; // defineTask debe correr al cargar el bundle

// registerRootComponent handles both Expo Go and native builds; it also
// calls AppRegistry.registerComponent for the web target used by front/pwa
// when the same entry is bundled through react-native-web.
registerRootComponent(App);
