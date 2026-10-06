// Web: los pesos los carga @fontsource en pwa/src/main.tsx y el navegador usa
// la fuente del sistema mientras llegan, sin bloquear la app. La version
// nativa (que usa expo-font) es useAppFonts.native.ts; esta evita que Vite
// empaquete expo-font, que no soporta.
export function useAppFonts(): boolean {
  return true;
}
