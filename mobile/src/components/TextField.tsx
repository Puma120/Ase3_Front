import { Text, TextInput, TextInputProps, View } from "react-native";

import { useStyles, useTheme } from "../theme/useTheme";
import { minTouchTarget, radius, spacing } from "../theme/tokens";

interface TextFieldProps extends TextInputProps {
  label: string;
  /** Ayuda o ejemplo: va antes del campo, no despues (decision 6). */
  hint?: string;
  error?: string;
}

// Label siempre arriba, error siempre abajo - patron unico y predecible en
// toda la app (menos que aprender/reconocer por pantalla).
export function TextField({ label, hint, error, style, ...inputProps }: TextFieldProps) {
  const { colors } = useTheme();
  const styles = useStyles((c, t) => ({
    wrapper: { gap: spacing.xs },
    label: { color: c.text, fontSize: t.sm, fontWeight: "600" },
    hint: { color: c.textMuted, fontSize: t.sm, lineHeight: t.line(t.sm) },
    input: {
      minHeight: minTouchTarget,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      color: c.text,
      paddingHorizontal: spacing.md,
      fontSize: t.md,
    },
    inputError: { borderColor: c.danger },
    error: { color: c.danger, fontSize: t.sm },
  }));

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
      <TextInput
        accessibilityLabel={hint ? `${label}. ${hint}` : label}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, !!error && styles.inputError, style]}
        {...inputProps}
      />
      {!!error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}
