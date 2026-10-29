import { useCallback, useEffect, useState } from "react";
import { AppState, Pressable, Text, View } from "react-native";

import { hasAppUpdate, updateApp } from "../native/appUpdate";
import { useStyles } from "../theme/useTheme";
import { minTouchTarget, radius, spacing } from "../theme/tokens";
import { Button } from "./Button";

// Aviso de version nueva (solo APK): se revisa al abrir la app y cada vez que
// vuelve a primer plano. El usuario decide: actualizar ahora o dejarlo para despues.
export function UpdatePrompt() {
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // "Ahora no" lo oculta hasta que la app se vuelva a abrir.
  const [dismissed, setDismissed] = useState(false);

  const check = useCallback(() => {
    hasAppUpdate().then((found) => found && setAvailable(true));
  }, []);

  useEffect(() => {
    check();
    const sub = AppState.addEventListener("change", (state) => state === "active" && check());
    return () => sub.remove();
  }, [check]);

  const styles = useStyles((c, t) => ({
    box: {
      gap: spacing.sm,
      padding: spacing.md,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: radius.lg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    title: { color: c.text, fontSize: t.md, fontWeight: "800" },
    text: { color: c.textMuted, fontSize: t.sm },
    later: { minHeight: minTouchTarget, alignItems: "center", justifyContent: "center" },
    laterText: { color: c.text, fontSize: t.md, fontWeight: "600", textDecorationLine: "underline" },
  }));

  if (!available || dismissed) return null;

  async function apply() {
    setBusy(true);
    setError("");
    // Si hay version nueva la app se reinicia y esta funcion no regresa.
    const msg = await updateApp();
    setBusy(false);
    if (msg) setError(msg);
  }

  return (
    <View accessibilityRole="alert" style={styles.box}>
      <Text style={styles.title}>Hay una versión nueva de Oportuno</Text>
      <Text style={styles.text}>Se descarga en unos segundos y la app se reinicia sola.</Text>
      {!!error && <Text style={styles.text}>{error}</Text>}
      <Button icon="refresh" label="Actualizar ahora" loading={busy} loadingLabel="Actualizando..." onPress={apply} />
      <Pressable accessibilityRole="button" onPress={() => setDismissed(true)} style={styles.later}>
        <Text style={styles.laterText}>Ahora no</Text>
      </Pressable>
    </View>
  );
}
