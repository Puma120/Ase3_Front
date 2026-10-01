// Stub para el build web: expo-web-browser (y expo-modules-core, del que
// depende) no bundlean bajo react-native-web (TurboModuleRegistry/
// EventEmitter nativos no existen en web). googleAuth.ts solo lo importa
// dinamicamente dentro de la rama Platform.OS !== "web", asi que esta
// funcion nunca se invoca en la PWA — solo necesita poder bundlearse.
export async function openAuthSessionAsync(): Promise<{ type: string; url?: string }> {
  throw new Error("expo-web-browser no esta disponible en web");
}
