import { Platform } from "react-native";

// Nivel de encabezado para la PWA. react-native-web pone role="heading" sin
// aria-level (que ARIA toma como nivel 2), asi que el titulo de cada pantalla
// se marca como nivel 1 y los titulos de tarjeta quedan en 2. En nativo no hay
// niveles. Los tipos de RN no incluyen aria-level, de ahi el cast.
export function headingLevel(level: 1 | 2 | 3): object {
  return Platform.OS === "web" ? { "aria-level": level } : {};
}
