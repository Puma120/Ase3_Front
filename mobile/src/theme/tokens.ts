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
};

export const lightColors: Colors = {
  background: "#f4f5f8",
  surface: "#ffffff",
  surfaceRaised: "#ffffff",
  border: "#dfe2e9",
  text: "#14171f",
  textMuted: "#5d6573",
  primary: "#2f62d6",
  primarySoft: "#e6edfc",
  onPrimary: "#ffffff",
  danger: "#c4402f",
  success: "#237a52",
  warning: "#9a6a12",
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
  lg: 16,
  pill: 999,
};

export const fontSize = {
  xs: 12,
  sm: 13,
  md: 15,
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
