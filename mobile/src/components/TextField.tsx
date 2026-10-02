import { Text, TextInput, TextInputProps, View } from "react-native";

import { useStyles, useTheme } from "../theme/useTheme";
import { fontSize, minTouchTarget, radius, spacing } from "../theme/tokens";

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

// Label siempre arriba, error siempre abajo - patron unico y predecible en
// toda la app (menos que aprender/reconocer por pantalla).
export function TextField({ label, error, style, ...inputProps }: TextFieldProps) {
  const { colors } = useTheme();
  const styles = useStyles((c) => ({
    wrapper: { gap: spacing.xs },
    label: { color: c.textMuted, fontSize: fontSize.sm, fontWeight: "600" },
    input: {
      minHeight: minTouchTarget,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      color: c.text,
      paddingHorizontal: spacing.md,
      fontSize: fontSize.md,
    },
    inputError: { borderColor: c.danger },
    error: { color: c.danger, fontSize: fontSize.sm },
  }));

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, !!error && styles.inputError, style]}
        {...inputProps}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}
