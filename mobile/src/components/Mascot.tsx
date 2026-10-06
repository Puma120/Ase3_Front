import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import { View } from "react-native";

import { usePreferences } from "../theme/preferences";

export type MascotMood = "calm" | "happy" | "sleepy";

const BODY = "#ffb36b";
const BELLY = "#ffd9b0";
const INK = "#2a1708";
const CHEEK = "#ff8f7a";
const LEAF = "#7fd3a6";

// Companero decorativo: una gota con hojita. No transmite informacion que no
// este ya en el texto, asi que se oculta a lectores de pantalla. Respeta la
// preferencia de Ajustes > Apariencia y no se dibuja si esta apagada.
export function Mascot({ mood = "calm", size = 72 }: { mood?: MascotMood; size?: number }) {
  const { mascot } = usePreferences();
  if (!mascot) return null;
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      pointerEvents="none"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path d="M50 14c-3-8 2-12 8-12-1 6-3 10-8 12z" fill={LEAF} />
        <Path d="M50 14C26 14 10 34 10 58c0 20 15 34 40 34s40-14 40-34C90 34 74 14 50 14z" fill={BODY} />
        <Ellipse cx="50" cy="70" rx="24" ry="17" fill={BELLY} />
        <Ellipse cx="25" cy="58" rx="7" ry="5" fill={CHEEK} opacity={0.55} />
        <Ellipse cx="75" cy="58" rx="7" ry="5" fill={CHEEK} opacity={0.55} />
        {mood === "happy" ? (
          <>
            <Path d="M30 48q6-9 12 0M58 48q6-9 12 0" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <Path d="M40 58q10 13 20 0z" fill={INK} />
          </>
        ) : mood === "sleepy" ? (
          <>
            <Path d="M30 50q6 5 12 0M58 50q6 5 12 0" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <Path d="M44 62q6 4 12 0" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            <Circle cx="36" cy="50" r="4.5" fill={INK} />
            <Circle cx="64" cy="50" r="4.5" fill={INK} />
            <Path d="M42 60q8 8 16 0" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
          </>
        )}
      </Svg>
    </View>
  );
}
