import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Switch, Text, View } from "react-native";

import { Button } from "../components/Button";
import { ScreenContainer } from "../components/ScreenContainer";
import { isFocusModeSupported } from "../native/focusMode";
import { ApiError } from "../services/apiClient";
import { getSettings, updateSettings, UserSettings } from "../services/settingsApi";
import { clearToken } from "../services/authStore";
import { setLoggedIn } from "../services/session";
import { colors, fontSize, spacing } from "../theme/tokens";

// Pantalla de ajustes: solo dos controles reales (sugerencias proactivas,
// modo de enfoque) mas cerrar sesion - sin opciones adicionales que el
// usuario no pidio.
export function SettingsScreen() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [error, setError] = useState("");
  const focusSupported = isFocusModeSupported();

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => setError("No se pudieron cargar los ajustes."));
  }, []);

  async function toggle(key: keyof UserSettings, value: boolean) {
    if (!settings) return;
    const previous = settings;
    setSettings({ ...settings, [key]: value });
    try {
      await updateSettings({ [key]: value });
    } catch (err) {
      setSettings(previous);
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el cambio.");
    }
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Ajustes</Text>

      {!settings && !error && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}

      {settings && (
        <>
          <Row
            label="Sugerencias proactivas"
            description="El asistente te avisa si detecta un patron, como tareas que pospones seguido."
            value={settings.proactive_suggestions_enabled}
            onChange={(value) => toggle("proactive_suggestions_enabled", value)}
          />

          <Row
            label="Modo de enfoque"
            description={
              focusSupported
                ? "Activa No Molestar en tu dispositivo cuando lo pidas en el chat."
                : "Solo disponible en la app de Android."
            }
            value={settings.focus_mode_enabled}
            onChange={(value) => toggle("focus_mode_enabled", value)}
            disabled={!focusSupported}
          />
        </>
      )}

      <ScreenContainer.Spacer size="xl" />

      <Button
        variant="secondary"
        label="Cerrar sesion"
        onPress={() => {
          clearToken();
          setLoggedIn(false);
        }}
      />
    </ScreenContainer>
  );
}

function Row({
  label,
  description,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: colors.primary, false: colors.border }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: "700",
    marginBottom: spacing.lg,
  },
  loading: {
    paddingVertical: spacing.lg,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  rowText: {
    flex: 1,
    gap: spacing.xs,
  },
  rowLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  rowDescription: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
});
