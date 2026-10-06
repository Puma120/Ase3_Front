// Cielo de la cabecera de Inicio: degradado y astro segun la hora local. El
// claro usa pasteles y el oscuro tonos de noche, para que el texto encima
// conserve contraste AA en cualquier franja.
export type SkyPhase = "dawn" | "day" | "dusk" | "night";

export function skyPhase(hour: number): SkyPhase {
  if (hour >= 5 && hour < 9) return "dawn";
  if (hour >= 9 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "dusk";
  return "night";
}

type Sky = { top: string; bottom: string; hills: string[] };

export const SKY: Record<"light" | "dark", Record<SkyPhase, Sky>> = {
  light: {
    dawn: { top: "#ffe3c8", bottom: "#fff3e6", hills: ["#f7cfb4", "#f1bfa6"] },
    day: { top: "#d8ecfb", bottom: "#fff6e8", hills: ["#cfe7cf", "#b9dcc0"] },
    dusk: { top: "#f9cfd8", bottom: "#ffeede", hills: ["#e7b9c9", "#d9a9bf"] },
    night: { top: "#d9d3f3", bottom: "#f1e9f7", hills: ["#c4b9e6", "#b3a7dd"] },
  },
  dark: {
    dawn: { top: "#3a2a48", bottom: "#4d3346", hills: ["#2c2139", "#241b30"] },
    day: { top: "#26324f", bottom: "#3a3a52", hills: ["#223344", "#1b2a39"] },
    dusk: { top: "#432a45", bottom: "#573142", hills: ["#2e1f35", "#251a2c"] },
    night: { top: "#171a38", bottom: "#251f45", hills: ["#1c1836", "#15122b"] },
  },
};

/** Posicion del astro (zona derecha del ancho, 0..1 alto del arco) segun la hora. */
export function bodyArc(hour: number, minutes = 0): { x: number; lift: number; sun: boolean } {
  const h = hour + minutes / 60;
  const sun = h >= 6 && h < 19;
  const t = sun ? (h - 6) / 13 : (((h - 19 + 24) % 24) / 11);
  return { x: 0.52 + t * 0.3, lift: Math.sin(Math.PI * Math.min(1, Math.max(0, t))), sun };
}
