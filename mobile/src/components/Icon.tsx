import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";

// Set de iconos propio (trazos estilo Lucide, 24x24) - sin emojis y sin
// dependencia de una libreria de iconos completa.
type Shape =
  | { t: "path"; d: string }
  | { t: "polyline"; points: string }
  | { t: "line"; x1: number; y1: number; x2: number; y2: number }
  | { t: "circle"; cx: number; cy: number; r: number }
  | { t: "rect"; x: number; y: number; w: number; h: number; rx?: number };

const p = (d: string): Shape => ({ t: "path", d });
const line = (x1: number, y1: number, x2: number, y2: number): Shape => ({
  t: "line",
  x1,
  y1,
  x2,
  y2,
});
const circle = (cx: number, cy: number, r: number): Shape => ({ t: "circle", cx, cy, r });
const poly = (points: string): Shape => ({ t: "polyline", points });

const ICONS = {
  home: [p("M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z")],
  chat: [p("M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z")],
  settings: [
    circle(12, 12, 3),
    p(
      "M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
    ),
  ],
  calendar: [
    { t: "rect", x: 3, y: 4, w: 18, h: 18, rx: 2 },
    line(16, 2, 16, 6),
    line(8, 2, 8, 6),
    line(3, 10, 21, 10),
  ],
  check: [poly("20 6 9 17 4 12")],
  checkCircle: [p("M22 11.1V12a10 10 0 1 1-5.9-9.1"), poly("22 4 12 14 9 11")],
  circle: [circle(12, 12, 9)],
  flame: [
    p(
      "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.4 1-3a2.5 2.5 0 0 0 2.5 2.5z",
    ),
  ],
  sparkles: [
    p("M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"),
    p("M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"),
  ],
  clock: [circle(12, 12, 10), poly("12 6 12 12 16 14")],
  send: [line(22, 2, 11, 13), p("M22 2 15 22l-4-9-9-4z")],
  bell: [p("M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"), p("M13.7 21a2 2 0 0 1-3.4 0")],
  moon: [p("M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z")],
  scissors: [
    circle(6, 6, 3),
    circle(6, 18, 3),
    line(20, 4, 8.1, 15.9),
    line(14.5, 14.5, 20, 20),
    line(8.1, 8.1, 12, 12),
  ],
  user: [p("M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"), circle(12, 7, 4)],
  link: [
    p("M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"),
    p("M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"),
  ],
  globe: [
    circle(12, 12, 10),
    line(2, 12, 22, 12),
    p("M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"),
  ],
  sliders: [
    line(4, 21, 4, 14),
    line(4, 10, 4, 3),
    line(12, 21, 12, 12),
    line(12, 8, 12, 3),
    line(20, 21, 20, 16),
    line(20, 12, 20, 3),
    line(1, 14, 7, 14),
    line(9, 8, 15, 8),
    line(17, 16, 23, 16),
  ],
  logout: [p("M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"), poly("16 17 21 12 16 7"), line(21, 12, 9, 12)],
  plus: [line(12, 5, 12, 19), line(5, 12, 19, 12)],
  minus: [line(5, 12, 19, 12)],
  refresh: [poly("23 4 23 10 17 10"), p("M20.5 15a9 9 0 1 1-2.1-9.4L23 10")],
  chevronDown: [poly("6 9 12 15 18 9")],
  chevronUp: [poly("18 15 12 9 6 15")],
  play: [poly("6 4 20 12 6 20 6 4")],
  zap: [poly("13 2 3 14 12 14 11 22 21 10 12 10 13 2")],
  undo: [poly("9 14 4 9 9 4"), p("M20 20v-7a4 4 0 0 0-4-4H4")],
  alert: [circle(12, 12, 10), line(12, 8, 12, 12), line(12, 16, 12.01, 16)],
  sun: [
    circle(12, 12, 4),
    line(12, 2, 12, 4),
    line(12, 20, 12, 22),
    line(4.9, 4.9, 6.3, 6.3),
    line(17.7, 17.7, 19.1, 19.1),
    line(2, 12, 4, 12),
    line(20, 12, 22, 12),
    line(4.9, 19.1, 6.3, 17.7),
    line(17.7, 6.3, 19.1, 4.9),
  ],
} satisfies Record<string, Shape[]>;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 20, color, strokeWidth = 2 }: IconProps) {
  return (
    // Decorativo: el significado siempre lo da el texto que lo acompana.
    <Svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {(ICONS[name] as Shape[]).map((s, i) => {
        switch (s.t) {
          case "path":
            return <Path key={i} d={s.d} />;
          case "polyline":
            return <Polyline key={i} points={s.points} />;
          case "line":
            return <Line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />;
          case "circle":
            return <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} />;
          case "rect":
            return <Rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx} />;
        }
      })}
    </Svg>
  );
}
