import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Switch, Text, View } from "react-native";

import { Button } from "../components/Button";
import { Card, MutedText } from "../components/Card";
import { Icon } from "../components/Icon";
import { Stepper } from "../components/Stepper";
import { TextField } from "../components/TextField";
import { isFocusModeSupported } from "../native/focusMode";
import { AgentParams, getAgentParams, updateAgentParams } from "../services/agentApi";
import { ApiError } from "../services/apiClient";
import { getMe } from "../services/authApi";
import { clearToken, setToken } from "../services/authStore";
import { startGoogleLogin } from "../services/googleAuth";
import { setLoggedIn } from "../services/session";
import {
  getGoogleStatus,
  getSettings,
  updateSettings,
  UserSettings,
} from "../services/settingsApi";
import { useResource } from "../services/useResource";
import { contentMaxWidth, fontSize, minTouchTarget, spacing } from "../theme/tokens";
import { useStyles, useTheme } from "../theme/useTheme";

const hourLabel = (h: number) => `${String(h % 24).padStart(2, "0")}:00`;

function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "";
  }
}

export function SettingsScreen() {
  const { colors } = useTheme();
  const styles = useStyles((c) => ({
    scroll: { flex: 1, backgroundColor: c.background },
    content: {
      width: "100%",
      maxWidth: contentMaxWidth,
      alignSelf: "center",
      padding: spacing.md,
      gap: spacing.md,
    },
    title: { color: c.text, fontSize: fontSize.xl, fontWeight: "800", paddingVertical: spacing.sm },
    row: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: minTouchTarget },
    rowText: { flex: 1, gap: 2 },
    rowLabel: { color: c.text, fontSize: fontSize.md, fontWeight: "600" },
    rowHint: { color: c.textMuted, fontSize: fontSize.xs, lineHeight: 16 },
    identity: { gap: 2 },
    name: { color: c.text, fontSize: fontSize.lg, fontWeight: "700" },
    email: { color: c.textMuted, fontSize: fontSize.sm },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    badgeText: { fontSize: fontSize.sm, fontWeight: "600" },
    divider: { height: 1, backgroundColor: c.border },
    error: { color: c.danger, fontSize: fontSize.sm },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.background },
  }));

  const me = useResource(getMe);
  const google = useResource(getGoogleStatus);
  const settings = useResource(getSettings);
  const agent = useResource(getAgentParams);

  const [timezone, setTimezone] = useState("");
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (settings.data) setTimezone(settings.data.timezone);
  }, [settings.data]);

  // Guardado automatico con update optimista: cada cambio se aplica al
  // instante y se revierte si el servidor lo rechaza (sin boton "Guardar").
  async function saveSettings(patch: Partial<UserSettings>) {
    const prev = settings.data;
    if (!prev) return;
    setError("");
    settings.setData(() => ({ ...prev, ...patch }));
    try {
      const saved = await updateSettings(patch);
      settings.setData(() => saved);
    } catch (err) {
      settings.setData(() => prev);
      setTimezone(prev.timezone);
      setError(
        err instanceof ApiError && err.status === 422
          ? "Valor no válido. Revisa la zona horaria (ej. America/Mexico_City)."
          : "No se pudo guardar el cambio.",
      );
    }
  }

  async function saveAgent(patch: Partial<AgentParams>) {
    const prev = agent.data;
    if (!prev) return;
    setError("");
    agent.setData(() => ({ ...prev, ...patch }));
    try {
      const saved = await updateAgentParams(patch);
      agent.setData(() => saved);
    } catch {
      agent.setData(() => prev);
      setError("No se pudo guardar el parámetro del agente.");
    }
  }

  async function handleGoogle() {
    setError("");
    setGoogleBusy(true);
    try {
      // En web la pagina navega a Google y vuelve con el token nuevo en el
      // hash; en nativo devuelve el token (o null si el usuario cancelo).
      const token = await startGoogleLogin();
      if (token) {
        setToken(token);
        google.reload();
      }
    } catch {
      setError("No se pudo conectar con Google.");
    } finally {
      setGoogleBusy(false);
    }
  }

  function handleLogout() {
    clearToken();
    setLoggedIn(false);
  }

  if (settings.loading && !settings.data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const s = settings.data;
  const a = agent.data;
  const connected = google.data === true;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>
        Ajustes
      </Text>

      {!!(error || settings.error) && <Text style={styles.error}>{error || settings.error}</Text>}

      <Card title="Perfil y Google" icon="user">
        <View style={styles.identity}>
          <Text style={styles.name}>{me.data?.full_name ?? "…"}</Text>
          <Text style={styles.email}>{me.data?.email ?? ""}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.badge}>
          <Icon
            name={connected ? "checkCircle" : "link"}
            size={18}
            color={connected ? colors.success : colors.warning}
          />
          <Text style={[styles.badgeText, { color: connected ? colors.success : colors.warning }]}>
            {google.loading
              ? "Comprobando Google…"
              : connected
                ? "Google conectado: Calendar, Tasks y Gmail"
                : "Google sin conectar"}
          </Text>
        </View>
        {!connected && !google.loading && (
          <MutedText>
            Sin Google el asistente no puede leer tu agenda, tareas ni correo.
          </MutedText>
        )}
        <Button
          variant={connected ? "secondary" : "primary"}
          icon="link"
          label={connected ? "Reconectar Google" : "Conectar Google"}
          onPress={handleGoogle}
          loading={googleBusy}
        />
      </Card>

      {s && (
        <Card title="Jornada y zona horaria" icon="globe">
          <TextField
            label="Zona horaria (IANA)"
            value={timezone}
            onChangeText={setTimezone}
            autoCapitalize="none"
            autoCorrect={false}
            onEndEditing={() => {
              const value = timezone.trim();
              if (value && value !== s.timezone) saveSettings({ timezone: value });
            }}
          />
          {deviceTimezone() !== "" && deviceTimezone() !== s.timezone && (
            <Button
              variant="secondary"
              icon="refresh"
              label={`Usar la de mi dispositivo (${deviceTimezone()})`}
              onPress={() => {
                setTimezone(deviceTimezone());
                saveSettings({ timezone: deviceTimezone() });
              }}
            />
          )}
          <View style={styles.divider} />
          <Stepper
            label="Inicio de jornada"
            hint="El asistente no agenda antes de esta hora."
            value={s.work_start_hour}
            min={0}
            max={s.work_end_hour - 1}
            format={hourLabel}
            onChange={(v) => saveSettings({ work_start_hour: v })}
          />
          <Stepper
            label="Fin de jornada"
            hint="Ni después de esta."
            value={s.work_end_hour}
            min={s.work_start_hour + 1}
            max={24}
            format={hourLabel}
            onChange={(v) => saveSettings({ work_end_hour: v })}
          />
        </Card>
      )}

      {s && (
        <Card title="Asistente" icon="sparkles">
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Sugerencias proactivas</Text>
              <Text style={styles.rowHint}>
                Avisos cuando detecta patrones, como tareas pospuestas varias veces.
              </Text>
            </View>
            <Switch
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#ffffff"
              accessibilityLabel="Sugerencias proactivas"
              value={s.proactive_suggestions_enabled}
              onValueChange={(v) => saveSettings({ proactive_suggestions_enabled: v })}
            />
          </View>
          {isFocusModeSupported() && (
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>Modo enfoque</Text>
                <Text style={styles.rowHint}>Activa No Molestar durante tus bloques de trabajo.</Text>
              </View>
              <Switch
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#ffffff"
                accessibilityLabel="Modo enfoque"
                value={s.focus_mode_enabled}
                onValueChange={(v) => saveSettings({ focus_mode_enabled: v })}
              />
            </View>
          )}
        </Card>
      )}

      {a && (
        <Card title="Parámetros del agente" icon="sliders">
          <Stepper
            label="Memoria a corto plazo"
            hint="Últimos mensajes que el agente recuerda en la conversación."
            value={a.short_term_memory_window}
            min={2}
            max={50}
            step={2}
            onChange={(v) => saveAgent({ short_term_memory_window: v })}
          />
          <Stepper
            label="Fragmentos de contexto (top-k)"
            hint="Cuántos recuerdos de tu historial consulta antes de responder."
            value={a.rag_top_k}
            min={1}
            max={20}
            onChange={(v) => saveAgent({ rag_top_k: v })}
          />
          <Stepper
            label="Creatividad (temperatura)"
            hint="Baja = respuestas más predecibles. Alta = más variadas."
            value={a.llm_temperature}
            min={0}
            max={1}
            step={0.1}
            format={(v) => v.toFixed(1)}
            onChange={(v) => saveAgent({ llm_temperature: v })}
          />
        </Card>
      )}

      <Button variant="secondary" icon="logout" label="Cerrar sesión" onPress={handleLogout} />
    </ScrollView>
  );
}
