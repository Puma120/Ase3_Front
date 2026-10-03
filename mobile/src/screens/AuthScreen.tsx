import { useState } from "react";
import { Text, View } from "react-native";

import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { ScreenContainer } from "../components/ScreenContainer";
import { setToken } from "../services/authStore";
import { startGoogleLogin } from "../services/googleAuth";
import { setLoggedIn } from "../services/session";
import { fontSize, radius, spacing } from "../theme/tokens";
import { useStyles, useTheme } from "../theme/useTheme";

// Login solo con Google. El acceso por invitacion lo controla la lista de
// usuarios de prueba del OAuth en Google Cloud.
export function AuthScreen() {
  const { colors } = useTheme();
  const styles = useStyles((c) => ({
    logo: {
      alignSelf: "center",
      width: 56,
      height: 56,
      borderRadius: radius.lg,
      backgroundColor: c.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
    },
    title: { color: c.text, fontSize: fontSize.xl, fontWeight: "700", textAlign: "center" },
    subtitle: {
      color: c.textMuted,
      fontSize: fontSize.md,
      textAlign: "center",
      marginTop: spacing.xs,
    },
    error: { color: c.danger, fontSize: fontSize.sm, textAlign: "center" },
  }));
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleLogin() {
    setError("");
    setGoogleLoading(true);
    try {
      const token = await startGoogleLogin();
      // En web la pagina navega fuera antes de llegar aqui; en nativo vuelve
      // con el token ya extraido (o null si el usuario cancelo).
      if (token) {
        setToken(token);
        setLoggedIn(true);
      }
    } catch {
      setError("No se pudo iniciar sesion con Google");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <ScreenContainer center>
      <View style={styles.logo}>
        <Icon name="sparkles" size={28} color={colors.primary} />
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        Agente TDAH
      </Text>
      <Text style={styles.subtitle}>Inicia sesion con tu cuenta de Google</Text>

      <ScreenContainer.Spacer size="lg" />

      {!!error && (
        <>
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
          <ScreenContainer.Spacer size="sm" />
        </>
      )}

      <Button label="Continuar con Google" onPress={handleGoogleLogin} loading={googleLoading} />
    </ScreenContainer>
  );
}
