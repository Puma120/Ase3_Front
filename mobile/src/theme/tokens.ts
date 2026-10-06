// Design tokens shared by front/mobile (native) and front/pwa (web, via
// react-native-web) — plain objects, no platform-specific APIs, safe to
// import from both targets. Colors live in two palettes (light/dark) that
// useTheme() picks from the system color scheme.

export interface Colors {
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primarySoft: string; // fondo tintado para estados activos / chips
  onPrimary: string;
  danger: string;
  success: string;
  warning: string;
  /** boxShadow de las tarjetas: profundidad suave; en oscuro basta el borde. */
  shadow: string;
  /** Anillo de foco del teclado (web). */
  focus: string;
}

export const darkColors: Colors = {
  background: "#0f1115",
  surface: "#171a21",
  surfaceRaised: "#1f232d",
  border: "#2c313d",
  text: "#f2f3f5",
  textMuted: "#9aa0ab",
  primary: "#6c9bff",
  primarySoft: "#1d2a47",
  onPrimary: "#0b1020",
  danger: "#ef7b70",
  success: "#5cbd8a",
  warning: "#e7b25a",
  shadow: "",
  focus: "#9db8ff",
};

export const lightColors: Colors = {
  background: "#f6f5f1",
  surface: "#ffffff",
  surfaceRaised: "#ffffff",
  border: "#e3e0d7",
  text: "#1a1c22",
  textMuted: "#575b67",
  primary: "#3050d0",
  primarySoft: "#e9edfb",
  onPrimary: "#ffffff",
  danger: "#c4402f",
  success: "#237a52",
  warning: "#9a6a12",
  shadow: "0 1px 2px rgba(26, 28, 34, 0.05), 0 8px 20px rgba(26, 28, 34, 0.06)",
  focus: "#3050d0",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
};

// Tamanos base (px). useTheme() los escala segun el tamano de letra elegido
// en Ajustes y el del navegador; las pantallas usan esa version escalada.
export const fontSize = {
  xs: 13,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
};

// Objetivo especifico 3 del PDF (interfaz accesible): area minima de toque
// recomendada (WCAG 2.5.5 / Material) para reducir errores de interaccion
// en usuarios con TDAH (menor precision motora bajo distraccion).
export const minTouchTarget = 44;

// Ancho maximo del contenido: en la PWA de escritorio evita lineas
// interminables; en movil no tiene efecto.
export const contentMaxWidth = 720;

// Atkinson Hyperlegible Next (Braille Institute): disenada para que cada letra
// se distinga de las demas; apoya "usar formas y palabras claras" (COGA). Un
// archivo por peso porque en Android fontWeight no elige entre familias.
export const FONT_FAMILY = "Atkinson Hyperlegible Next";
export const FONT_FILES = {
  "400": "AtkinsonHyperlegibleNext_400Regular",
  "500": "AtkinsonHyperlegibleNext_500Medium",
  "600": "AtkinsonHyperlegibleNext_600SemiBold",
  "700": "AtkinsonHyperlegibleNext_700Bold",
  "800": "AtkinsonHyperlegibleNext_800ExtraBold",
} as const;
