import { useState } from "react";
import { Text, View } from "react-native";

import { headingLevel } from "../components/a11y";
import { Button } from "../components/Button";
import { Mascot } from "../components/Mascot";
import { ScreenContainer } from "../components/ScreenContainer";
import { setToken } from "../services/authStore";
import { startGoogleLogin } from "../services/googleAuth";
import { setLoggedIn } from "../services/session";
import { radius, spacing } from "../theme/tokens";
import { useStyles } from "../theme/useTheme";

// Login solo con Google. El acceso por invitacion lo controla la lista de
// usuarios de prueba del OAuth en Google Cloud.
export function AuthScreen() {
  const styles = useStyles((c, t) => ({
    mark: {
      alignSelf: "flex-start",
      backgroundColor: c.highlight,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      marginBottom: spacing.md,
    },
    markText: { color: c.onHighlight, fontSize: t.sm, fontWeight: "800" },
    title: { color: c.text, fontSize: t.xxl, fontWeight: "800" },
    hero: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
    rule: { height: 4, width: 56, borderRadius: 2, backgroundColor: c.highlight, marginVertical: spacing.md },
    subtitle: { color: c.textMuted, fontSize: t.md, lineHeight: t.line(t.md) },
    error: { color: c.danger, fontSize: t.sm, lineHeight: t.line(t.sm) },
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
      setError("No se pudo iniciar sesión con Google. Inténtalo otra vez.");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <ScreenContainer center>
      <View style={styles.hero}>
        <View style={styles.mark}>
          <Text style={styles.markText}>Tu día, paso a paso</Text>
        </View>
        <Mascot mood="happy" size={88} />
      </View>
      <Text accessibilityRole="header" {...headingLevel(1)} style={styles.title}>
        Agente TDAH
      </Text>
      <View style={styles.rule} />
      <Text style={styles.subtitle}>Entra con tu cuenta de Google. No necesitas contraseña.</Text>

      <ScreenContainer.Spacer size="lg" />

      {!!error && (
        <>
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
          <ScreenContainer.Spacer size="sm" />
        </>
      )}

      <Button
        label="Continuar con Google"
        loadingLabel="Abriendo Google…"
        onPress={handleGoogleLogin}
        loading={googleLoading}
      />
    </ScreenContainer>
  );
}
