import { ActivityIndicator, Pressable, Text } from "react-native";

import { useStyles, useTheme } from "../theme/useTheme";
import { minTouchTarget, radius, spacing } from "../theme/tokens";
import { Icon, IconName } from "./Icon";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  loading?: boolean;
  /** Texto mientras carga: nunca se muestra un indicador sin explicacion. */
  loadingLabel?: string;
  icon?: IconName;
}

// Boton unico y consistente reusado en toda la app - una sola forma de
// tocar "confirmar/enviar" reduce la carga de decision (Objetivo 3, PDF).
export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  loadingLabel = "Cargando…",
  icon,
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = useStyles((c, t) => ({
    base: {
      minHeight: minTouchTarget,
      borderRadius: radius.pill,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    primary: { backgroundColor: c.primary },
    secondary: { backgroundColor: "transparent", borderWidth: 2, borderColor: c.primary },
    disabled: { opacity: 0.5 },
    pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
    label: { fontSize: t.md, fontWeight: "700", textAlign: "center", flexShrink: 1 },
    labelPrimary: { color: c.onPrimary },
    labelSecondary: { color: c.text },
  }));

  const isPrimary = variant === "primary";
  const fg = isPrimary ? colors.onPrimary : colors.text;
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        inactive && styles.disabled,
        pressed && !inactive && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isPrimary ? colors.onPrimary : colors.primary} />
      ) : (
        icon && <Icon name={icon} size={18} color={fg} />
      )}
      <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelSecondary]}>
        {loading ? loadingLabel : label}
      </Text>
    </Pressable>
  );
}
