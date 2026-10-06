import { useCallback, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { useStyles, useTheme } from "../theme/useTheme";
import { spacing } from "../theme/tokens";
import { Button } from "./Button";
import { Icon } from "./Icon";

export type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string; retry: () => void };

// Estado de guardado de una tarjeta de Ajustes. track() ejecuta el guardado
// y deja el resultado visible hasta el siguiente cambio (sin toasts que
// aparecen y desaparecen solos).
export function useSaveState() {
  const [state, setState] = useState<SaveState>({ kind: "idle" });
  // errorMessage traduce el error a un texto claro: nunca se muestra el
  // mensaje tecnico crudo ("Failed to fetch", "Error 500").
  const track = useCallback(async function run(
    save: () => Promise<void>,
    errorMessage: string | ((err: unknown) => string),
  ) {
    setState({ kind: "saving" });
    try {
      await save();
      setState({ kind: "saved" });
    } catch (err) {
      setState({
        kind: "error",
        message: typeof errorMessage === "function" ? errorMessage(err) : errorMessage,
        retry: () => void run(save, errorMessage),
      });
    }
  }, []);
  return { state, track };
}

// Va en el `trailing` de la Card: ocupa el hueco del encabezado, asi que
// aparecer no mueve el resto del contenido.
export function SaveBadge({ state }: { state: SaveState }) {
  const { colors } = useTheme();
  const styles = useStyles((c, t) => ({
    row: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    text: { fontSize: t.sm, fontWeight: "600", color: c.textMuted },
    saved: { color: c.success },
  }));
  if (state.kind !== "saving" && state.kind !== "saved") return null;
  return (
    <View style={styles.row} aria-live="polite">
      {state.kind === "saving" ? (
        <ActivityIndicator size="small" color={colors.textMuted} />
      ) : (
        <Icon name="check" size={16} color={colors.success} />
      )}
      <Text style={[styles.text, state.kind === "saved" && styles.saved]}>
        {state.kind === "saving" ? "Guardando…" : "Guardado"}
      </Text>
    </View>
  );
}

// Error de guardado dentro de la tarjeta, junto a los controles que afecta,
// con la forma de arreglarlo.
export function SaveError({ state }: { state: SaveState }) {
  const { colors } = useTheme();
  const styles = useStyles((c, t) => ({
    box: { gap: spacing.sm },
    row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
    text: { flex: 1, color: c.danger, fontSize: t.sm, lineHeight: t.line(t.sm) },
  }));
  if (state.kind !== "error") return null;
  return (
    <View style={styles.box}>
      <View style={styles.row}>
        <Icon name="alert" size={18} color={colors.danger} />
        <Text accessibilityRole="alert" style={styles.text}>
          {state.message}
        </Text>
      </View>
      <Button variant="secondary" icon="refresh" label="Reintentar" onPress={state.retry} />
    </View>
  );
}
