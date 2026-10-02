import { ActivityIndicator, Pressable, Text } from "react-native";

import { useStyles, useTheme } from "../theme/useTheme";
import { fontSize, minTouchTarget, radius, spacing } from "../theme/tokens";
import { Icon, IconName } from "./Icon";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  loading?: boolean;
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
  icon,
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = useStyles((c) => ({
    base: {
      minHeight: minTouchTarget,
      borderRadius: radius.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    primary: { backgroundColor: c.primary },
    secondary: { backgroundColor: "transparent", borderWidth: 1, borderColor: c.border },
    disabled: { opacity: 0.5 },
    pressed: { opacity: 0.85 },
    label: { fontSize: fontSize.md, fontWeight: "600" },
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
      accessibilityState={{ disabled: inactive }}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        inactive && styles.disabled,
        pressed && !inactive && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.onPrimary : colors.primary} />
      ) : (
        <>
          {icon && <Icon name={icon} size={18} color={fg} />}
          <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelSecondary]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
