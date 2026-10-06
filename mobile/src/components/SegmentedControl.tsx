import { Pressable, Text, View } from "react-native";

import { useStyles, useTheme } from "../theme/useTheme";
import { minTouchTarget, radius, spacing } from "../theme/tokens";
import { Icon } from "./Icon";

interface SegmentedControlProps<T extends string> {
  label: string;
  hint?: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

// Eleccion entre pocas opciones, todas a la vista (sin menus desplegables).
// La opcion activa se marca con fondo, borde, negrita y check: no solo color.
export function SegmentedControl<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  const styles = useStyles((c, t) => ({
    wrapper: { gap: spacing.xs },
    label: { color: c.text, fontSize: t.md, fontWeight: "600" },
    hint: { color: c.textMuted, fontSize: t.sm, lineHeight: t.line(t.sm) },
    row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingTop: spacing.xs },
    option: {
      flexGrow: 1,
      minHeight: minTouchTarget,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    optionActive: { borderColor: c.primary, borderWidth: 2, backgroundColor: c.primarySoft },
    optionText: { color: c.text, fontSize: t.md },
    optionTextActive: { fontWeight: "700" },
  }));

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.row}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              aria-checked={selected}
              onPress={() => onChange(o.value)}
              style={[styles.option, selected && styles.optionActive]}
            >
              {selected && <Icon name="check" size={16} color={colors.primary} />}
              <Text style={[styles.optionText, selected && styles.optionTextActive]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
