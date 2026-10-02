import { useMemo } from "react";
import { StyleSheet, useColorScheme } from "react-native";

import { Colors, darkColors, lightColors } from "./tokens";

export function useTheme(): { colors: Colors; scheme: "light" | "dark" } {
  const scheme = useColorScheme() === "light" ? "light" : "dark";
  return { colors: scheme === "light" ? lightColors : darkColors, scheme };
}

// Crea los estilos de un componente a partir de los colores del tema activo;
// se recalcula solo al cambiar el esquema del sistema.
export function useStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (colors: Colors) => T,
): T {
  const { colors } = useTheme();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
}
