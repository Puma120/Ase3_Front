import { useEffect, useMemo } from "react";
import { Platform, StyleSheet, useColorScheme } from "react-native";

import { TEXT_SCALE, usePreferences } from "./preferences";
import { Colors, darkColors, fontSize, lightColors } from "./tokens";

export interface Type {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  /** Interlineado comodo para un tamano dado (~1.45x). */
  line: (size: number) => number;
}

// En la PWA los tamanos se dan en px: se multiplican por el tamano de letra
// del navegador (16px por defecto) para respetar ese ajuste del sistema. En
// nativo no hace falta: <Text> ya aplica la escala de fuente del sistema.
const browserScale = (() => {
  if (Platform.OS !== "web" || typeof document === "undefined") return 1;
  const px = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return Number.isFinite(px) && px > 0 ? px / 16 : 1;
})();

export function useTheme(): { colors: Colors; scheme: "light" | "dark"; type: Type } {
  const system = useColorScheme();
  const { theme, textSize } = usePreferences();
  const scheme = theme === "system" ? (system === "light" ? "light" : "dark") : theme;
  const scale = TEXT_SCALE[textSize] * browserScale;
  const type = useMemo<Type>(() => {
    const s = (n: number) => Math.round(n * scale);
    return {
      xs: s(fontSize.xs),
      sm: s(fontSize.sm),
      md: s(fontSize.md),
      lg: s(fontSize.lg),
      xl: s(fontSize.xl),
      xxl: s(fontSize.xxl),
      line: (size) => Math.round(size * 1.45),
    };
  }, [scale]);
  return { colors: scheme === "light" ? lightColors : darkColors, scheme, type };
}

// Crea los estilos de un componente a partir del tema activo (colores y
// tamanos de letra ya escalados); se recalcula solo cuando cambian.
export function useStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (colors: Colors, type: Type) => T,
): T {
  const { colors, type } = useTheme();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => StyleSheet.create(factory(colors, type)), [colors, type]);
}

// Web: alinea el color de la barra del navegador y el color-scheme nativo
// (scrollbars, controles) con el tema elegido en la app.
export function useApplyWebTheme(): void {
  const { colors, scheme } = useTheme();
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    document.documentElement.style.colorScheme = scheme;
    document.documentElement.style.backgroundColor = colors.background;
    document.body.style.backgroundColor = colors.background;
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      meta.setAttribute("content", colors.background);
    });
  }, [colors, scheme]);
}
