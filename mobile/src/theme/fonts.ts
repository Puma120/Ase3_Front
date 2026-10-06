// Asigna la tipografia a todo estilo de texto desde useStyles, para no repetir
// fontFamily en cada pantalla. En web una sola familia con fontWeight (los
// pesos los carga @fontsource en pwa/src/main.tsx); en nativo Android no mezcla
// fontWeight con familias personalizadas, asi que cada peso es su propio
// archivo y fontWeight se quita.
import { Platform } from "react-native";

import { FONT_FAMILY, FONT_FILES, FONT_MONO_FAMILY, FONT_MONO_FILES } from "./tokens";

const WEB_STACK = `"${FONT_FAMILY}", system-ui, -apple-system, "Segoe UI", sans-serif`;

type Weight = keyof typeof FONT_FILES;
const isWeight = (w: unknown): w is Weight => typeof w === "string" && w in FONT_FILES;

const WEB_MONO = `"${FONT_MONO_FAMILY}", ui-monospace, "Cascadia Mono", Consolas, monospace`;

// Horas y cifras en la mono: spread en el estilo (`...mono("700")`). Ya trae
// su familia, asi que withFont lo deja intacto.
export function mono(weight: keyof typeof FONT_MONO_FILES = "500") {
  return Platform.OS === "web"
    ? { fontFamily: WEB_MONO, fontWeight: weight }
    : { fontFamily: FONT_MONO_FILES[weight] };
}

export function withFont<T extends Record<string, unknown>>(styles: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, style] of Object.entries(styles)) {
    if (!style || typeof style !== "object" || !("fontSize" in style) || "fontFamily" in style) {
      out[key] = style;
      continue;
    }
    const { fontWeight, ...rest } = style as { fontWeight?: unknown } & Record<string, unknown>;
    out[key] =
      Platform.OS === "web"
        ? { ...style, fontFamily: WEB_STACK }
        : { ...rest, fontFamily: FONT_FILES[isWeight(fontWeight) ? fontWeight : "400"] };
  }
  return out as T;
}
