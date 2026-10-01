import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { Button } from "../components/Button";
import { ScreenContainer } from "../components/ScreenContainer";
import { TextField } from "../components/TextField";
import { ApiError } from "../services/apiClient";
import { login, register } from "../services/authApi";
import { setToken } from "../services/authStore";
import { startGoogleLogin } from "../services/googleAuth";
import { setLoggedIn } from "../services/session";
import { colors, fontSize, spacing } from "../theme/tokens";

// Pantalla unica para login/registro (un toggle, no dos pantallas separadas)
// - menos navegacion que recordar. Un solo error visible a la vez, mensaje
// concreto (Objetivo 3 del PDF: reducir errores de navegacion por sesion).
export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isRegister = mode === "register";

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await register(email.trim(), fullName.trim(), password);
      }
      const token = await login(email.trim(), password);
      setToken(token);
      setLoggedIn(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
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
      setError("No se pudo iniciar sesion con Google");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <ScreenContainer center>
      <Text style={styles.title}>Agente TDAH</Text>
      <Text style={styles.subtitle}>
        {isRegister ? "Crea tu cuenta para empezar" : "Inicia sesion para continuar"}
      </Text>

      <ScreenContainer.Spacer size="lg" />

      {isRegister && (
        <>
          <TextField
            label="Nombre"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
          <ScreenContainer.Spacer size="sm" />
        </>
      )}

      <TextField
        label="Correo"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <ScreenContainer.Spacer size="sm" />
      <TextField
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {!!error && (
        <>
          <ScreenContainer.Spacer size="sm" />
          <Text style={styles.error}>{error}</Text>
        </>
      )}

      <ScreenContainer.Spacer size="lg" />

      <Button
        label={isRegister ? "Crear cuenta" : "Entrar"}
        onPress={handleSubmit}
        loading={loading}
        disabled={!email || !password || (isRegister && !fullName)}
      />

      <ScreenContainer.Spacer size="sm" />

      <Button
        variant="secondary"
        label={isRegister ? "Ya tengo cuenta" : "Crear una cuenta"}
        onPress={() => {
          setError("");
          setMode(isRegister ? "login" : "register");
        }}
      />

      <ScreenContainer.Spacer size="sm" />

      <Button
        variant="secondary"
        label="Continuar con Google"
        onPress={handleGoogleLogin}
        loading={googleLoading}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
