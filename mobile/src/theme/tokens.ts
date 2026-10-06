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

// Lenguaje "amanecer a noche": papel calido, sombras tintadas, un solo acento
// durazno (highlight) reservado a "lo que toca ahora". El cielo de la cabecera
// cambia con la hora (theme/sky.ts).
export const darkColors: Colors = {
  background: "#17131f",
  surface: "#231d2f",
  surfaceRaised: "#2c2539",
  border: "#3a3249",
  controlBorder: "#8a7f9b",
  text: "#f6eee4",
  textMuted: "#b6abc2",
  primary: "#f6eee4",
  primarySoft: "#302841",
  onPrimary: "#17131f",
  danger: "#ff9a8f",
  success: "#7fd3a6",
  warning: "#f0bd68",
  highlight: "#ffb36b",
  onHighlight: "#2a1708",
  dayMorning: "#2a2140",
  dayAfternoon: "#3a2230",
  dayNight: "#1d2440",
  shadow: "0 6px 18px rgba(8, 4, 20, 0.45)",
  focus: "#ffd199",
};

export const lightColors: Colors = {
  background: "#fbf5ee",
  surface: "#fffdf9",
  surfaceRaised: "#ffffff",
  border: "#ecdfce",
  controlBorder: "#8f7c68",
  text: "#2a2233",
  textMuted: "#625869",
  primary: "#2a2233",
  primarySoft: "#f3e8f4",
  onPrimary: "#fffdf9",
  danger: "#b3261e",
  success: "#1f7a4d",
  warning: "#8a5a00",
  highlight: "#ffb36b",
  onHighlight: "#2a1708",
  dayMorning: "#ffe9d2",
  dayAfternoon: "#fde0e4",
  dayNight: "#e4defa",
  shadow: "0 6px 18px rgba(84, 52, 110, 0.14)",
  focus: "#7a3fc4",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Esquinas generosas y amables; mas cerradas en lo pequeno.
export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
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
