import { useState } from "react";
import { KeyboardAvoidingView, ScrollView, Text, View } from "react-native";

import { headingLevel } from "../components/a11y";
import { Button } from "../components/Button";
import { Mascot } from "../components/Mascot";
import { ScreenContainer } from "../components/ScreenContainer";
import { TextField } from "../components/TextField";
import { ApiError } from "../services/apiClient";
import { loginWithPassword, registerWithPassword } from "../services/authApi";
import { setToken } from "../services/authStore";
import { startGoogleLogin } from "../services/googleAuth";
import { setLoggedIn } from "../services/session";
import { radius, spacing } from "../theme/tokens";
import { useStyles } from "../theme/useTheme";

// Google es la via principal (deja ademas Calendar/Tasks/Gmail conectados). El
// acceso con correo y contrasena es alterno, para quien no puede usar Google;
// esas cuentas no tienen Google conectado hasta que lo hagan desde Ajustes.
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
    hero: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
    },
    rule: {
      height: 4,
      width: 56,
      borderRadius: 2,
      backgroundColor: c.highlight,
      marginVertical: spacing.md,
    },
    subtitle: { color: c.textMuted, fontSize: t.md, lineHeight: t.line(t.md) },
    error: { color: c.danger, fontSize: t.sm, lineHeight: t.line(t.sm) },
  }));
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  async function handlePasswordSubmit() {
    setError("");
    if (
      !email.trim() ||
      !password ||
      (mode === "register" && !fullName.trim())
    ) {
      setError("Completa todos los campos.");
      return;
    }
    if (mode === "register" && password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setPasswordLoading(true);
    try {
      const token =
        mode === "login"
          ? await loginWithPassword(email.trim(), password)
          : await registerWithPassword(email.trim(), password, fullName.trim());
      setToken(token);
      setLoggedIn(true);
    } catch (e) {
      setError(
        e instanceof ApiError && e.status !== 422
          ? e.message
          : "No se pudo continuar. Revisa tus datos e inténtalo de nuevo.",
      );
    } finally {
      setPasswordLoading(false);
    }
  }

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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenContainer center>
          <View style={styles.hero}>
            <View style={styles.mark}>
              <Text style={styles.markText}>Tu día, paso a paso</Text>
            </View>
            <Mascot mood="happy" size={88} />
          </View>
          <Text
            accessibilityRole="header"
            {...headingLevel(1)}
            style={styles.title}
          >
            Oportuno
          </Text>
          <View style={styles.rule} />
          <Text style={styles.subtitle}>
            Entra con tu cuenta de Google o con tu correo.
          </Text>

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

          <ScreenContainer.Spacer size="lg" />
          <Text style={styles.subtitle}>
            {mode === "login"
              ? "O entra con tu correo"
              : "O crea una cuenta con tu correo"}
          </Text>
          <ScreenContainer.Spacer size="sm" />

          {mode === "register" && (
            <>
              <TextField
                label="Nombre"
                value={fullName}
                onChangeText={setFullName}
                autoComplete="name"
                textContentType="name"
              />
              <ScreenContainer.Spacer size="sm" />
            </>
          )}
          <TextField
            label="Correo"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
          />
          <ScreenContainer.Spacer size="sm" />
          <TextField
            label="Contraseña"
            hint={mode === "register" ? "Mínimo 8 caracteres" : undefined}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            textContentType={mode === "login" ? "password" : "newPassword"}
            onSubmitEditing={handlePasswordSubmit}
          />
          <ScreenContainer.Spacer size="md" />
          <Button
            label={mode === "login" ? "Entrar" : "Crear cuenta"}
            loadingLabel="Un momento…"
            variant="secondary"
            onPress={handlePasswordSubmit}
            loading={passwordLoading}
          />
          <ScreenContainer.Spacer size="sm" />
          <Button
            label={
              mode === "login"
                ? "No tengo cuenta: crear una"
                : "Ya tengo cuenta: entrar"
            }
            variant="secondary"
            onPress={() => {
              setError("");
              setMode(mode === "login" ? "register" : "login");
            }}
          />
        </ScreenContainer>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
