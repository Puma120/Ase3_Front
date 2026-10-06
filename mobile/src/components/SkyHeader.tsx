import { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";

import { bodyArc, SKY, skyPhase } from "../theme/sky";
import { radius, spacing } from "../theme/tokens";
import { useTheme } from "../theme/useTheme";
import { Mascot } from "./Mascot";

const STARS: [number, number, number][] = [
  [40, 22, 1.6], [96, 52, 1.2], [150, 18, 1.4], [212, 40, 1.1], [262, 14, 1.5], [330, 30, 1.2], [372, 58, 1.4],
];

// Cabecera de Inicio: un cielo que cambia con la hora (amanecer, dia, tarde,
// noche) con colinas al frente. Es el unico lugar con degradado; el contenido
// (saludo y fecha) va encima y conserva contraste AA en todas las franjas.
export function SkyHeader({ children, now = new Date() }: PropsWithChildren<{ now?: Date }>) {
  const { scheme } = useTheme();
  const hour = now.getHours();
  const phase = skyPhase(hour);
  const sky = SKY[scheme][phase];
  const { x, lift, sun } = bodyArc(hour, now.getMinutes());
  const dark = scheme === "dark";
  const cy = 108 - lift * 62;

  return (
    <View style={styles.wrap}>
      <Svg
        style={styles.sky}
        viewBox="0 0 400 190"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden
      >
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={sky.top} />
            <Stop offset="1" stopColor={sky.bottom} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="400" height="190" fill="url(#sky)" />
        {(phase === "night" || (dark && phase === "dusk")) &&
          STARS.map(([sx, sy, r]) => (
            <Circle key={sx} cx={sx} cy={sy} r={r} fill={dark ? "#f6eee4" : "#8a7fb5"} opacity={0.8} />
          ))}
        {sun ? (
          <>
            <Circle cx={x * 400} cy={cy} r={34} fill="#ffb36b" opacity={dark ? 0.18 : 0.3} />
            <Circle cx={x * 400} cy={cy} r={20} fill="#ffb36b" />
          </>
        ) : (
          <>
            <Circle cx={x * 400} cy={cy} r={20} fill={dark ? "#f6eee4" : "#fffdf9"} />
            <Circle cx={x * 400 - 6} cy={cy + 5} r={3.5} fill={dark ? "#cfc3dd" : "#e4defa"} />
            <Circle cx={x * 400 + 6} cy={cy - 6} r={2.5} fill={dark ? "#cfc3dd" : "#e4defa"} />
          </>
        )}
        <Path d="M0 140C60 112 120 112 190 136S330 150 400 118V190H0z" fill={sky.hills[0]} />
        <Path d="M0 164C80 142 150 146 230 162S350 170 400 150V190H0z" fill={sky.hills[1]} />
      </Svg>
      <View style={styles.content}>{children}</View>
      <View style={styles.mascot}>
        <Mascot mood={phase === "night" ? "sleepy" : "calm"} size={68} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sky: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" },
  wrap: {
    overflow: "hidden",
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    minHeight: 190,
    justifyContent: "flex-start",
  },
  content: {
    padding: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + spacing.lg,
    maxWidth: "62%",
    gap: 2,
  },
  mascot: { position: "absolute", right: spacing.md, bottom: spacing.sm },
});
