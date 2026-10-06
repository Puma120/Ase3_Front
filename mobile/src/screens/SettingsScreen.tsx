import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, Switch, Text, View } from "react-native";

import { headingLevel } from "../components/a11y";
import { Button } from "../components/Button";
import { Card, MutedText } from "../components/Card";
import { Collapsible } from "../components/Collapsible";
import { Icon } from "../components/Icon";
import { SaveBadge, SaveError, useSaveState } from "../components/SaveStatus";
import { SegmentedControl } from "../components/SegmentedControl";
import { Stepper } from "../components/Stepper";
import { TextField } from "../components/TextField";
import { isFocusModeSupported } from "../native/focusMode";
import {
  disableLocation,
  enableLocation,
  isLocationEnabled,
  isLocationSupported,
  stopLocationTracking,
} from "../native/location";
import { disablePush, enablePush, getPushPrefs, isPushSupported, setPushSound, teardownPush } from "../native/push";
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
import { setPreferences, TextSizePref, ThemePref, usePreferences } from "../theme/preferences";
import { contentMaxWidth, minTouchTarget, spacing } from "../theme/tokens";
import { useStyles, useTheme } from "../theme/useTheme";

const hourLabel = (h: number) => `${String(h % 24).padStart(2, "0")}:00`;

const deviceTimezone = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "";
  }
})();

const SAVE_ERROR = "No se pudo guardar el cambio. Revisa tu conexión.";

type Tracker = ReturnType<typeof useSaveState>;

export function SettingsScreen({ active }: { active: boolean }) {
  const { colors } = useTheme();
  const prefs = usePreferences();
  const styles = useStyles((c, t) => ({
    scroll: { flex: 1, backgroundColor: c.background },
    content: {
      width: "100%",
      maxWidth: contentMaxWidth,
      alignSelf: "center",
      padding: spacing.md,
      gap: spacing.md,
    },
    title: { color: c.text, fontSize: t.xl, fontWeight: "800", paddingVertical: spacing.sm },
    row: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: minTouchTarget },
    rowText: { flex: 1, gap: 2 },
    rowLabel: { color: c.text, fontSize: t.md, fontWeight: "600" },
    rowHint: { color: c.textMuted, fontSize: t.sm, lineHeight: t.line(t.sm) },
    identity: { gap: 2 },
    name: { color: c.text, fontSize: t.lg, fontWeight: "700" },
    email: { color: c.textMuted, fontSize: t.sm },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    badgeText: { fontSize: t.sm, fontWeight: "600" },
    divider: { height: 1, backgroundColor: c.border },
    error: { color: c.danger, fontSize: t.sm, lineHeight: t.line(t.sm) },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      backgroundColor: c.background,
    },
  }));

  const me = useResource(getMe);
  const google = useResource(getGoogleStatus);
  const settings = useResource(getSettings);
  const agent = useResource(getAgentParams);

  const alertsSave = useSaveState();
  const workSave = useSaveState();
  const agentSave = useSaveState();

  const [timezone, setTimezone] = useState("");
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const [pushOn, setPushOn] = useState(() => getPushPrefs().enabled);
  const [pushSound, setPushSoundState] = useState(() => getPushPrefs().sound);
  const [locationOn, setLocationOn] = useState(isLocationEnabled);

  useEffect(() => {
    if (settings.data) setTimezone(settings.data.timezone);
  }, [settings.data]);

  // Al entrar a Ajustes se comprueba de nuevo si Google sigue conectado.
  const wasActive = useRef(active);
  useEffect(() => {
    if (active && !wasActive.current) google.refresh();
    wasActive.current = active;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Guardado automatico con update optimista: cada cambio se aplica al
  // instante y se revierte si el servidor lo rechaza (sin boton "Guardar").
  // La tarjeta muestra "Guardado" o el error con "Reintentar".
  function saveSettings(patch: Partial<UserSettings>, tracker: Tracker) {
    const prev = settings.data;
    if (!prev) return;
    settings.setData(() => ({ ...prev, ...patch }));
    void tracker.track(
      async () => {
        try {
          const saved = await updateSettings(patch);
          settings.setData(() => saved);
        } catch (err) {
          settings.setData(() => prev);
          setTimezone(prev.timezone);
          throw err;
        }
      },
      (err) =>
        err instanceof ApiError && err.status === 422
          ? "Esa zona horaria no existe. Escríbela como en el ejemplo."
          : SAVE_ERROR,
    );
  }

  function saveAgent(patch: Partial<AgentParams>) {
    const prev = agent.data;
    if (!prev) return;
    agent.setData(() => ({ ...prev, ...patch }));
    void agentSave.track(async () => {
      try {
        const saved = await updateAgentParams(patch);
        agent.setData(() => saved);
      } catch (err) {
        agent.setData(() => prev);
        throw err;
      }
    }, SAVE_ERROR);
  }

  function togglePush(on: boolean) {
    setPushOn(on);
    void alertsSave.track(async () => {
      if (!on) return disablePush();
      if (!(await enablePush(pushSound))) {
        setPushOn(false);
        throw new Error("denied");
      }
    }, "Android no dio permiso para los avisos. Puedes darlo en Ajustes del teléfono > Notificaciones.");
  }

  function togglePushSound(sound: boolean) {
    setPushSoundState(sound);
    void alertsSave.track(() => setPushSound(sound), SAVE_ERROR);
  }

  function toggleLocation(on: boolean) {
    setLocationOn(on);
    void alertsSave.track(async () => {
      if (!on) return disableLocation();
      if (!(await enableLocation())) {
        setLocationOn(false);
        throw new Error("denied");
      }
    }, "Android no dio permiso para la ubicación. Puedes darlo en Ajustes del teléfono > Ubicación.");
  }

  function commitTimezone() {
    const value = timezone.trim();
    if (settings.data && value && value !== settings.data.timezone) {
      saveSettings({ timezone: value }, workSave);
    }
  }

  async function handleGoogle() {
    setGoogleError("");
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
      setGoogleError("No se pudo conectar con Google. Inténtalo otra vez.");
    } finally {
      setGoogleBusy(false);
    }
  }

  async function handleLogout() {
    // El DELETE del token FCM necesita la sesion: va antes de borrar el JWT.
    await Promise.allSettled([teardownPush(), stopLocationTracking()]);
    clearToken();
    setLoggedIn(false);
  }

  if (settings.loading && !settings.data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
        <MutedText>Cargando tus ajustes…</MutedText>
      </View>
    );
  }

  const s = settings.data;
  const a = agent.data;
  const connected = google.data === true;

  function switchRow(
    label: string,
    hint: string,
    value: boolean,
    onChange: (v: boolean) => void,
  ) {
    return (
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>{label}</Text>
          <Text style={styles.rowHint}>{hint}</Text>
        </View>
        <Switch
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor="#ffffff"
          accessibilityLabel={label}
          accessibilityHint={hint}
          value={value}
          onValueChange={onChange}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" {...headingLevel(1)} style={styles.title}>
        Ajustes
      </Text>

      {!!settings.error && (
        <>
          <Text accessibilityRole="alert" style={styles.error}>
            {settings.error}
          </Text>
          <Button variant="secondary" icon="refresh" label="Reintentar" onPress={settings.reload} />
        </>
      )}

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
            Sin Google el asistente no puede leer tu agenda, tus tareas ni tu correo.
          </MutedText>
        )}
        <Button
          variant={connected ? "secondary" : "primary"}
          icon="link"
          label={connected ? "Reconectar Google" : "Conectar Google"}
          loadingLabel="Conectando…"
          onPress={handleGoogle}
          loading={googleBusy}
        />
        {!!googleError && (
          <Text accessibilityRole="alert" style={styles.error}>
            {googleError}
          </Text>
        )}
      </Card>

      {s && (
        <Card title="Avisos y enfoque" icon="bell" trailing={<SaveBadge state={alertsSave.state} />}>
          {switchRow(
            "Sugerencias del asistente",
            "El asistente te avisa cuando nota algo, por ejemplo una tarea que pospones mucho.",
            s.proactive_suggestions_enabled,
            (v) => saveSettings({ proactive_suggestions_enabled: v }, alertsSave),
          )}
          {isPushSupported() && (
            <>
              <View style={styles.divider} />
              {switchRow(
                "Avisos en este teléfono",
                "Te llegan aunque la app esté cerrada. Al activarlo, Android te pide permiso.",
                pushOn,
                togglePush,
              )}
              {pushOn &&
                switchRow(
                  "Con sonido",
                  "Apagado: los avisos aparecen sin sonar ni vibrar.",
                  pushSound,
                  togglePushSound,
                )}
              {pushOn &&
                switchRow(
                  "Horas de silencio",
                  "En estas horas los avisos no llegan al teléfono. Los ves después en Inicio.",
                  s.quiet_hours_enabled,
                  (v) => saveSettings({ quiet_hours_enabled: v }, alertsSave),
                )}
              {pushOn && s.quiet_hours_enabled && (
                <>
                  <Stepper
                    label="Silencio desde"
                    value={s.quiet_start_hour}
                    min={0}
                    max={23}
                    format={hourLabel}
                    onChange={(v) => saveSettings({ quiet_start_hour: v }, alertsSave)}
                  />
                  <Stepper
                    label="Silencio hasta"
                    value={s.quiet_end_hour}
                    min={0}
                    max={23}
                    format={hourLabel}
                    onChange={(v) => saveSettings({ quiet_end_hour: v }, alertsSave)}
                  />
                </>
              )}
            </>
          )}
          {isLocationSupported() &&
            switchRow(
              "Avisarme a qué hora salir",
              "Usa tu ubicación para calcular el tráfico hacia tus citas. Al activarlo, Android te pide permiso.",
              locationOn,
              toggleLocation,
            )}
          {isFocusModeSupported() &&
            switchRow(
              "Modo enfoque",
              "Activa No molestar durante tus bloques de trabajo.",
              s.focus_mode_enabled,
              (v) => saveSettings({ focus_mode_enabled: v }, alertsSave),
            )}
          <SaveError state={alertsSave.state} />
        </Card>
      )}

      {s && (
        <Card title="Jornada y zona horaria" icon="globe" trailing={<SaveBadge state={workSave.state} />}>
          {deviceTimezone !== "" && deviceTimezone !== s.timezone ? (
            <Button
              variant="secondary"
              icon="refresh"
              label={`Usar la zona de este dispositivo (${deviceTimezone})`}
              onPress={() => {
                setTimezone(deviceTimezone);
                saveSettings({ timezone: deviceTimezone }, workSave);
              }}
            />
          ) : (
            <MutedText>Usas la zona horaria de este dispositivo.</MutedText>
          )}
          <TextField
            label="Escribir otra zona horaria"
            hint="Ejemplo: America/Mexico_City"
            value={timezone}
            onChangeText={setTimezone}
            autoCapitalize="none"
            autoCorrect={false}
            onBlur={commitTimezone}
            onSubmitEditing={commitTimezone}
            returnKeyType="done"
          />
          <View style={styles.divider} />
          <Stepper
            label="Inicio de jornada"
            hint="El asistente no agenda nada antes de esta hora."
            value={s.work_start_hour}
            min={0}
            max={s.work_end_hour - 1}
            format={hourLabel}
            onChange={(v) => saveSettings({ work_start_hour: v }, workSave)}
          />
          <Stepper
            label="Fin de jornada"
            hint="El asistente no agenda nada después de esta hora."
            value={s.work_end_hour}
            min={s.work_start_hour + 1}
            max={24}
            format={hourLabel}
            onChange={(v) => saveSettings({ work_end_hour: v }, workSave)}
          />
          <SaveError state={workSave.state} />
        </Card>
      )}

      <Card title="Apariencia" icon="sun">
        <SegmentedControl<ThemePref>
          label="Tema"
          hint="«Sistema» usa el mismo tema que tu teléfono o computadora."
          value={prefs.theme}
          options={[
            { value: "system", label: "Sistema" },
            { value: "light", label: "Claro" },
            { value: "dark", label: "Oscuro" },
          ]}
          onChange={(theme) => setPreferences({ theme })}
        />
        <SegmentedControl<TextSizePref>
          label="Tamaño de letra"
          hint="Cambia el tamaño del texto en toda la app."
          value={prefs.textSize}
          options={[
            { value: "normal", label: "Normal" },
            { value: "large", label: "Grande" },
            { value: "xlarge", label: "Muy grande" },
          ]}
          onChange={(textSize) => setPreferences({ textSize })}
        />
        {/* Decorativa: no aporta informacion, solo compania. */}
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Mascota</Text>
            <Text style={styles.rowHint}>Muestra un personaje ilustrado en Inicio y en el acceso.</Text>
          </View>
          <Switch
            trackColor={{ true: colors.primary, false: colors.controlBorder }}
            thumbColor="#ffffff"
            accessibilityLabel="Mascota"
            accessibilityHint="Muestra u oculta el personaje ilustrado"
            value={prefs.mascot}
            onValueChange={(mascot) => setPreferences({ mascot })}
          />
        </View>
      </Card>

      {a && (
        <Collapsible title="Opciones avanzadas" icon="sliders" storageKey="settings_advanced">
          <Card title="Cómo responde el asistente" icon="sliders" trailing={<SaveBadge state={agentSave.state} />}>
            <Stepper
              label="Mensajes que recuerda"
              hint="Cuántos mensajes recientes del chat tiene en cuenta al responder."
              value={a.short_term_memory_window}
              min={2}
              max={50}
              step={2}
              onChange={(v) => saveAgent({ short_term_memory_window: v })}
            />
            <Stepper
              label="Recuerdos que consulta"
              hint="Cuántas conversaciones pasadas revisa antes de responder."
              value={a.rag_top_k}
              min={1}
              max={20}
              onChange={(v) => saveAgent({ rag_top_k: v })}
            />
            <Stepper
              label="Variedad de las respuestas"
              hint="Baja: respuestas más parecidas entre sí. Alta: más variadas."
              value={a.llm_temperature}
              min={0}
              max={1}
              step={0.1}
              format={(v) => v.toFixed(1)}
              onChange={(v) => saveAgent({ llm_temperature: v })}
            />
            <SaveError state={agentSave.state} />
          </Card>
        </Collapsible>
      )}

      <Button variant="secondary" icon="logout" label="Cerrar sesión" onPress={handleLogout} />
    </ScrollView>
  );
}
