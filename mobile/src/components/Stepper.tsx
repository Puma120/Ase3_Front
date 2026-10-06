import { Pressable, Text, View } from "react-native";

import { useStyles, useTheme } from "../theme/useTheme";
import { minTouchTarget, radius, spacing } from "../theme/tokens";
import { Icon } from "./Icon";

interface StepperProps {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
}

// Control numerico con - / + (area de toque 44px): mas preciso y menos
// propenso a error que un slider para usuarios con TDAH.
export function Stepper({ label, hint, value, min, max, step = 1, format, onChange }: StepperProps) {
  const { colors } = useTheme();
  const styles = useStyles((c, t) => ({
    // Con letra grande los controles bajan debajo del texto en vez de
    // apretarlo en una columna angosta.
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      columnGap: spacing.md,
      rowGap: spacing.xs,
      minHeight: minTouchTarget,
    },
    text: { flexGrow: 1, flexShrink: 1, flexBasis: 180, gap: 2 },
    label: { color: c.text, fontSize: t.md, fontWeight: "600" },
    hint: { color: c.textMuted, fontSize: t.sm, lineHeight: t.line(t.sm) },
    controls: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginLeft: "auto" },
    btn: {
      width: minTouchTarget,
      height: minTouchTarget,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceRaised,
      alignItems: "center",
      justifyContent: "center",
    },
    btnDisabled: { opacity: 0.4 },
    value: {
      minWidth: 56,
      textAlign: "center",
      color: c.text,
      fontSize: t.md,
      fontWeight: "700",
    },
  }));

  const round = (n: number) => Math.round(n * 100) / 100;
  const canDec = value - step >= min - 1e-9;
  const canInc = value + step <= max + 1e-9;

  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {!!hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Disminuir ${label}`}
          disabled={!canDec}
          onPress={() => onChange(round(value - step))}
          style={[styles.btn, !canDec && styles.btnDisabled]}
        >
          <Icon name="minus" size={18} color={colors.text} />
        </Pressable>
        <Text style={styles.value} aria-live="polite">
          {format ? format(value) : String(value)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Aumentar ${label}`}
          disabled={!canInc}
          onPress={() => onChange(round(value + step))}
          style={[styles.btn, !canInc && styles.btnDisabled]}
        >
          <Icon name="plus" size={18} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}
