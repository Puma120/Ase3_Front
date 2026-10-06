// Design tokens shared by front/mobile (native) and front/pwa (web, via
// react-native-web) — plain objects, no platform-specific APIs, safe to
// import from both targets. Colors live in two palettes (light/dark) that
// useTheme() picks from the system color scheme.

export interface Colors {
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  /** Borde de controles (inputs, segmentados): >= 3:1 (WCAG 1.4.11). `border` es solo filete decorativo. */
  controlBorder: string;
  text: string;
  textMuted: string;
  /** Tinta: botones, barras de seccion y marca de pestana activa. */
  primary: string;
  primarySoft: string; // fondo tenue para estados activos / chips
  onPrimary: string;
  danger: string;
  success: string;
  warning: string;
  /** Unico acento: marcador amarillo, reservado para "lo que toca ahora". */
  highlight: string;
  onHighlight: string;
  /** Paginas de revision de la hoja de llamado: tinte de la cabecera de Inicio. */
  dayMorning: string;
  dayAfternoon: string;
  dayNight: string;
  /** boxShadow opcional; la hoja es plana, queda vacio. */
  shadow: string;
  /** Anillo de foco del teclado (web). */
  focus: string;
}

// Lenguaje "hoja de llamado": tinta sobre papel, reglas finas, sin tarjetas.
export const darkColors: Colors = {
  background: "#121214",
  surface: "#1a1a1e",
  surfaceRaised: "#222228",
  border: "#3a3a42",
  controlBorder: "#7d7d89",
  text: "#f1f1ec",
  textMuted: "#a4a4ae",
  primary: "#f1f1ec",
  primarySoft: "#26262c",
  onPrimary: "#121214",
  danger: "#f08a80",
  success: "#63c48f",
  warning: "#e7b25a",
  highlight: "#ffe14d",
  onHighlight: "#14141a",
  dayMorning: "#1a2640",
  dayAfternoon: "#3a1d29",
  dayNight: "#173326",
  shadow: "",
  focus: "#8fb0ff",
};

export const lightColors: Colors = {
  background: "#f9f9f6",
  surface: "#ffffff",
  surfaceRaised: "#ffffff",
  border: "#c9c9c2",
  controlBorder: "#8a8a92",
  text: "#14141a",
  textMuted: "#55555f",
  primary: "#14141a",
  primarySoft: "#ecece6",
  onPrimary: "#f9f9f6",
  danger: "#b3261e",
  success: "#1f7a4d",
  warning: "#8a5a00",
  highlight: "#ffe14d",
  onHighlight: "#14141a",
  dayMorning: "#dfe9fb",
  dayAfternoon: "#fbe1e8",
  dayNight: "#dcefe3",
  shadow: "",
  focus: "#2547c9",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Esquinas casi rectas: la hoja es papel, no burbujas.
export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
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

// Atkinson Hyperlegible Mono para horas y cifras: columnas alineadas y
// ceros distinguibles de la o.
export const FONT_MONO_FAMILY = "Atkinson Hyperlegible Mono";
export const FONT_MONO_FILES = {
  "500": "AtkinsonHyperlegibleMono_500Medium",
  "700": "AtkinsonHyperlegibleMono_700Bold",
} as const;
