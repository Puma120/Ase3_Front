// Design tokens shared by front/mobile (native) and front/pwa (web, via
// react-native-web) — plain objects, no platform-specific APIs, safe to
// import from both targets.

export const colors = {
  background: "#0f1115",
  surface: "#1a1d24",
  surfaceRaised: "#232733",
  border: "#2c313d",
  text: "#f2f3f5",
  textMuted: "#9aa0ab",
  primary: "#5b8def",
  danger: "#e2685c",
  success: "#5cbd8a",
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
  sm: 13,
  md: 15,
  lg: 18,
  xl: 24,
};

// Objetivo especifico 3 del PDF (interfaz accesible): area minima de toque
// recomendada (WCAG 2.5.5 / Material) para reducir errores de interaccion
// en usuarios con TDAH (menor precision motora bajo distraccion).
export const minTouchTarget = 44;
