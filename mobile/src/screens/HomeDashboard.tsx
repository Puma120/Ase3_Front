import { ReactNode, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from "react-native";

import { headingLevel } from "../components/a11y";
import { Button } from "../components/Button";
import { Card, MutedText } from "../components/Card";
import { Collapsible } from "../components/Collapsible";
import { Icon, IconName } from "../components/Icon";
import { SkyHeader } from "../components/SkyHeader";
import {
  completeTask,
  getFreeSlots,
  getPendingTasks,
  getRoutinesSummary,
  getSuggestion,
  getTodayEvents,
  reopenTask,
  RoutinesSummary,
  TaskItem,
} from "../services/homeApi";
import { getMe } from "../services/authApi";
import { AppNotification, listNotifications, markAllRead } from "../services/proactiveApi";
import { Resource, useResource } from "../services/useResource";
import { mono } from "../theme/fonts";
import { contentMaxWidth, minTouchTarget, radius, spacing } from "../theme/tokens";
import { useReducedMotion } from "../theme/useReducedMotion";
import { useStyles, useTheme } from "../theme/useTheme";

// Se envian tal cual como mensaje del usuario: primera persona y palabras
// sencillas (decision 8).
const QUICK_ACTIONS: { label: string; icon: IconName; prompt: string }[] = [
  {
    label: "Dividir tarea",
    icon: "scissors",
    prompt: "Ayúdame a dividir una tarea grande en pasos pequeños. Pregúntame primero cuál es.",
  },
  {
    label: "Poner alarma",
    icon: "bell",
    prompt:
      "Quiero poner una alarma para mi siguiente evento. Pregúntame cuál es y a qué hora quiero empezar a prepararme.",
  },
  {
    label: "Modo enfoque",
    icon: "moon",
    prompt:
      "Quiero activar el modo enfoque (No molestar) un rato. Pregúntame cuánto tiempo y confirma antes de activarlo.",
  },
];

// Decision 4: antes de empezar, saber cuanto toma, que se necesita y cual es
// el primer paso.
const startPrompt = (title: string) =>
  `Quiero empezar «${title}». Dime cuánto tiempo toma más o menos, qué necesito tener a la mano y solo el primer paso.`;

const DEFAULT_SUGGESTION = "¿No sabes por dónde empezar? Cuéntale al asistente qué tienes pendiente.";

const OTHER_TASKS = 3;
const MAX_EVENTS = 3;
const MAX_SLOTS = 2;

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

// Inicio: lo principal arriba y a la vista (decision 2, maximo 5 opciones):
// avisos sin leer (si hay) -> empezar + atajos -> tareas -> agenda -> huecos.
// Solo lo que no es urgente (racha y avisos ya leidos) queda plegado.
export function HomeDashboard({
  active,
  onQuickAction,
  onOpenSettings,
}: {
  active: boolean;
  onQuickAction: (prompt: string) => void;
  onOpenSettings: () => void;
}) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const styles = useStyles((c, t) => ({
    scroll: { flex: 1, backgroundColor: c.background },
    content: {
      width: "100%",
      maxWidth: contentMaxWidth,
      alignSelf: "center",
      paddingBottom: spacing.lg,
    },
    body: { padding: spacing.md, gap: spacing.md },
    title: { color: c.text, fontSize: t.xl, fontWeight: "800" },
    date: { color: c.text, fontSize: t.sm, ...mono("500") },
    start: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
      gap: spacing.sm,
      ...(c.shadow ? { boxShadow: c.shadow } : null),
    },
    startHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    startTitle: { color: c.text, fontSize: t.md, fontWeight: "800" },
    // Dos lineas reservadas: la sugerencia llega despues sin mover nada.
    startText: { color: c.text, fontSize: t.md, lineHeight: t.line(t.md), minHeight: t.line(t.md) * 2 },
    // La tarea de ahora: la "piedra" durazno, unico bloque con el acento.
    next: {
      gap: spacing.sm,
      padding: spacing.md,
      backgroundColor: c.highlight,
      borderRadius: radius.lg,
      ...(c.shadow ? { boxShadow: c.shadow } : null),
    },
    nextLabel: { color: c.onHighlight, fontSize: t.sm, fontWeight: "800" },
    nextTitle: { flex: 1, color: c.onHighlight, fontSize: t.lg, fontWeight: "800" },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      minHeight: minTouchTarget,
    },
    // Evento sobre la linea de tiempo: regla de tinta a la izquierda.
    eventRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      minHeight: minTouchTarget,
      borderLeftWidth: 4,
      borderLeftColor: c.highlight,
      borderRadius: 2,
      paddingLeft: spacing.sm,
    },
    rowTime: { minWidth: 112, color: c.text, fontSize: t.sm, ...mono("700") },
    rowText: { flex: 1, color: c.text, fontSize: t.md, lineHeight: t.line(t.md) },
    rowTextDone: { color: c.textMuted, textDecorationLine: "line-through" },
    check: {
      width: minTouchTarget,
      height: minTouchTarget,
      alignItems: "center",
      justifyContent: "center",
    },
    undo: {
      minHeight: minTouchTarget,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    undoText: { color: c.text, fontSize: t.sm, fontWeight: "800" },
    streakRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    streakNum: { color: c.text, fontSize: t.xxl, ...mono("700") },
    streakLabel: { color: c.textMuted, fontSize: t.sm },
    bars: { flex: 1, flexDirection: "row", alignItems: "flex-end", gap: 6, height: 56 },
    barCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 4, height: "100%" },
    bar: { width: "100%", borderRadius: 4 },
    barDay: { color: c.textMuted, fontSize: t.xs, ...mono("500") },
    stats: { flexDirection: "row", gap: spacing.sm },
    stat: {
      flex: 1,
      backgroundColor: c.primarySoft,
      borderRadius: radius.md,
      padding: spacing.sm,
      alignItems: "center",
    },
    statNum: { color: c.text, fontSize: t.lg, ...mono("700") },
    statLabel: { color: c.textMuted, fontSize: t.xs, textAlign: "center" },
    slot: {
      minHeight: minTouchTarget,
      borderRadius: radius.md,
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor: c.controlBorder,
      paddingHorizontal: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    slotTime: { color: c.text, fontSize: t.md, ...mono("700") },
    slotHint: { color: c.text, fontSize: t.sm, fontWeight: "800" },
    actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    action: {
      minHeight: minTouchTarget,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.controlBorder,
      backgroundColor: c.surface,
    },
    actionText: { color: c.text, fontSize: t.md, fontWeight: "600" },
    error: { color: c.danger, fontSize: t.sm, lineHeight: t.line(t.sm) },
    alertRow: { gap: 2, paddingVertical: spacing.xs },
    alertTitle: { color: c.text, fontSize: t.md, fontWeight: "600" },
    loadingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: minTouchTarget },
    srOnly: { position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 },
  }));

  const me = useResource(getMe);
  const alerts = useResource(listNotifications);
  const suggestion = useResource(getSuggestion);
  const events = useResource(getTodayEvents);
  const tasks = useResource(getPendingTasks);
  const routines = useResource(getRoutinesSummary);
  const slots = useResource(() => getFreeSlots());

  // Tareas marcadas como hechas en esta visita: siguen a la vista con
  // "Deshacer" hasta el siguiente refresco (sin tiempo limite).
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [taskError, setTaskError] = useState("");
  const [announcement, setAnnouncement] = useState("");

  // Al volver a Inicio desde otra pestana, se actualizan los datos sin
  // quitar lo que ya se ve.
  const wasActive = useRef(active);
  useEffect(() => {
    if (active && !wasActive.current) {
      [alerts, suggestion, events, tasks, routines, slots].forEach((r) => r.refresh());
      setDoneIds(new Set());
      setTaskError("");
    }
    wasActive.current = active;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function announce(text: string) {
    setAnnouncement(text);
    if (Platform.OS !== "web") AccessibilityInfo.announceForAccessibility(text);
  }

  function markDone(id: string, done: boolean) {
    setDoneIds((prev) => {
      const next = new Set(prev);
      if (done) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function toggleTask(task: TaskItem) {
    const done = doneIds.has(task.id);
    setTaskError("");
    markDone(task.id, !done);
    announce(done ? `«${task.title}» vuelve a pendientes` : `Tarea completada: ${task.title}`);
    try {
      await (done ? reopenTask(task.id) : completeTask(task.id));
      routines.refresh();
    } catch {
      markDone(task.id, done);
      setTaskError(
        done
          ? `No se pudo deshacer «${task.title}». Inténtalo otra vez.`
          : `No se pudo completar «${task.title}». Inténtalo otra vez.`,
      );
    }
  }

  const firstName = me.data?.full_name.split(" ")[0];
  const todayRaw = new Date().toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const today = todayRaw.charAt(0).toUpperCase() + todayRaw.slice(1);
  const unreadAlerts = alerts.data?.filter((n) => !n.read) ?? [];
  const readAlerts = alerts.data?.filter((n) => n.read) ?? [];
  const streak = routines.data?.streak_days;

  // Envoltorio comun de estados: cargando / sin Google / error / contenido.
  // Mientras carga reserva el alto esperado, para que nada salte de lugar.
  function body<T>(r: Resource<T>, rows: number, render: (data: T) => ReactNode) {
    if (r.loading)
      return (
        <View style={{ minHeight: rows * minTouchTarget }}>
          <View style={styles.loadingRow}>
            {!reducedMotion && <ActivityIndicator size="small" color={colors.primary} />}
            <MutedText>Cargando…</MutedText>
          </View>
        </View>
      );
    if (r.needsGoogle)
      return (
        <>
          <MutedText>Conecta tu cuenta de Google para ver esta información.</MutedText>
          <Button variant="secondary" label="Ir a Ajustes" icon="settings" onPress={onOpenSettings} />
        </>
      );
    if (r.error)
      return (
        <>
          <Text style={styles.error}>{r.error}</Text>
          <Button variant="secondary" label="Reintentar" icon="refresh" onPress={r.reload} />
        </>
      );
    return r.data === null ? null : render(r.data);
  }

  function renderTaskRow(task: TaskItem, big = false) {
    const done = doneIds.has(task.id);
    return (
      <View key={task.id} style={styles.row}>
        <Pressable
          accessibilityRole="checkbox"
          aria-checked={done}
          accessibilityLabel={task.title}
          accessibilityHint={done ? "Toca para volver a pendientes" : "Toca para marcarla como hecha"}
          onPress={() => toggleTask(task)}
          style={styles.check}
        >
          <Icon
            name={done ? "checkCircle" : "circle"}
            size={24}
            color={big ? colors.onHighlight : done ? colors.success : colors.textMuted}
          />
        </Pressable>
        <Text style={[big ? styles.nextTitle : styles.rowText, done && styles.rowTextDone]} numberOfLines={2}>
          {task.title}
        </Text>
        {done && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Deshacer: ${task.title}`}
            onPress={() => toggleTask(task)}
            style={styles.undo}
          >
            <Icon name="undo" size={16} color={big ? colors.onHighlight : colors.text} />
            <Text style={[styles.undoText, big && { color: colors.onHighlight }]}>Deshacer</Text>
          </Pressable>
        )}
      </View>
    );
  }

  function renderTasks(list: TaskItem[]) {
    if (list.length === 0) return <MutedText>No tienes tareas pendientes.</MutedText>;
    const next = list.find((t) => !doneIds.has(t.id));
    const others = list.filter((t) => t !== next);
    const shown = others.slice(0, OTHER_TASKS);
    const hiddenCount = others.length - shown.length;
    return (
      <>
        {next ? (
          <View style={styles.next}>
            <Text style={styles.nextLabel}>Siguiente tarea</Text>
            {renderTaskRow(next, true)}
            <Button label="Empezar" icon="play" onPress={() => onQuickAction(startPrompt(next.title))} />
          </View>
        ) : (
          <MutedText>Terminaste todas tus tareas pendientes.</MutedText>
        )}
        {shown.map((t) => renderTaskRow(t))}
        {hiddenCount > 0 && (
          <MutedText>
            Y {hiddenCount} {hiddenCount === 1 ? "tarea más" : "tareas más"}.
          </MutedText>
        )}
        {!!taskError && (
          <Text accessibilityRole="alert" style={styles.error}>
            {taskError}
          </Text>
        )}
      </>
    );
  }

  function renderRoutines(summary: RoutinesSummary) {
    const max = Math.max(1, ...summary.week.map((d) => d.count));
    const dayName = (date: string, weekday: "long" | "narrow") =>
      new Date(`${date}T12:00:00`).toLocaleDateString("es", { weekday });
    const chartLabel =
      "Tareas por día: " + summary.week.map((d) => `${dayName(d.date, "long")} ${d.count}`).join(", ");
    return (
      <>
        <View style={styles.streakRow}>
          <View>
            <Text style={styles.streakNum}>{summary.streak_days}</Text>
            <Text style={styles.streakLabel}>
              {summary.streak_days === 1 ? "día seguido" : "días seguidos"}
            </Text>
          </View>
          <View style={styles.bars} accessible accessibilityLabel={chartLabel}>
            {summary.week.map((d) => (
              <View key={d.date} style={styles.barCol}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(4, (d.count / max) * 36),
                      backgroundColor: d.count > 0 ? colors.primary : colors.border,
                    },
                  ]}
                />
                <Text style={styles.barDay}>{dayName(d.date, "narrow")}</Text>
              </View>
            ))}
          </View>
        </View>
        <MutedText>En los últimos 7 días:</MutedText>
        <View style={styles.stats}>
          {renderStat(summary.completed_week, "completadas")}
          {renderStat(summary.created_week, "creadas")}
          {renderStat(summary.scheduled_week, "agendadas")}
        </View>
      </>
    );
  }

  function renderAlert(n: AppNotification) {
    return (
      <View key={n.id} style={styles.alertRow}>
        <Text style={styles.alertTitle}>{n.title}</Text>
        <MutedText>{n.body}</MutedText>
      </View>
    );
  }

  function renderStat(n: number, label: string) {
    return (
      <View key={label} style={styles.stat}>
        <Text style={styles.statNum}>{n}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <SkyHeader>
        <Text accessibilityRole="header" {...headingLevel(1)} style={styles.title}>
          {greeting()}
          {firstName ? `, ${firstName}` : ""}
        </Text>
        <Text style={styles.date}>{today}</Text>
      </SkyHeader>
      <View style={styles.body}>

      {/* Avisos con hora ("Sal ya", "en 10 minutos"): nunca ocultos. */}
      {unreadAlerts.length > 0 && (
        <Card
          title={unreadAlerts.length === 1 ? "Aviso nuevo" : "Avisos nuevos"}
          icon="bell"
          trailing={
            <Button
              variant="secondary"
              label="Marcar leídos"
              onPress={() => {
                markAllRead().catch(() => {});
                alerts.setData((prev) => prev?.map((n) => ({ ...n, read: true })) ?? prev);
              }}
            />
          }
        >
          {unreadAlerts.slice(0, 5).map(renderAlert)}
          {unreadAlerts.length > 5 && (
            <MutedText>Y {unreadAlerts.length - 5} avisos más.</MutedText>
          )}
        </Card>
      )}

      <View style={styles.start}>
        <View style={styles.startHead}>
          <Icon name="sparkles" size={18} color={colors.text} />
          <Text accessibilityRole="header" style={styles.startTitle}>
            Para empezar
          </Text>
        </View>
        <Text style={styles.startText}>{suggestion.data ?? DEFAULT_SUGGESTION}</Text>
        <Button
          label="Hablar con el asistente"
          icon="chat"
          onPress={() =>
            onQuickAction(
              suggestion.data
                ? `Me sugeriste: «${suggestion.data}». Ayúdame a empezar.`
                : "Ayúdame a decidir qué hago ahora. Pregúntame qué tengo pendiente.",
            )
          }
        />
        {/* Plegable; recuerda si se dejo abierto, asi quien usa mucho los
            atajos los sigue teniendo a un toque. */}
        <Collapsible title="Acciones rápidas" icon="zap" storageKey="home_quick">
          <View style={styles.actions}>
            {QUICK_ACTIONS.map((a) => (
              <Pressable
                key={a.label}
                accessibilityRole="button"
                onPress={() => onQuickAction(a.prompt)}
                style={({ pressed }) => [styles.action, pressed && { opacity: 0.8 }]}
              >
                <Icon name={a.icon} size={18} color={colors.text} />
                <Text style={styles.actionText}>{a.label}</Text>
              </Pressable>
            ))}
          </View>
        </Collapsible>
      </View>

      <Card title="Tareas pendientes" icon="checkCircle">
        {body(tasks, 3, renderTasks)}
      </Card>

      <Card title="Agenda de hoy" icon="calendar">
        {body(events, 2, (list) => {
          const now = Date.now();
          const upcoming = list.filter((e) => e.all_day || new Date(e.end).getTime() > now);
          if (upcoming.length === 0)
            return <MutedText>No te quedan eventos hoy. Es buen momento para avanzar una tarea.</MutedText>;
          const rest = upcoming.length - MAX_EVENTS;
          return (
            <>
              {upcoming.slice(0, MAX_EVENTS).map((e) => (
                <View key={e.id} style={styles.eventRow}>
                  <Text style={styles.rowTime}>
                    {e.all_day ? "Todo el día" : `${fmtTime(e.start)} – ${fmtTime(e.end)}`}
                  </Text>
                  <Text style={styles.rowText} numberOfLines={2}>
                    {e.summary}
                  </Text>
                </View>
              ))}
              {rest > 0 && (
                <MutedText>
                  Y {rest} {rest === 1 ? "evento más" : "eventos más"}.
                </MutedText>
              )}
            </>
          );
        })}
      </Card>

      <Card title="Próximos huecos libres" icon="clock">
        {body(slots, 2, (list) =>
          list.length === 0 ? (
            <MutedText>No hay huecos de 25 minutos en las próximas 6 horas.</MutedText>
          ) : (
            list.slice(0, MAX_SLOTS).map((s) => (
              <Pressable
                key={s.start}
                accessibilityRole="button"
                accessibilityLabel={`Agendar 25 minutos de enfoque a las ${fmtTime(s.start)}`}
                onPress={() =>
                  onQuickAction(
                    `Agenda un bloque de enfoque de 25 minutos a las ${fmtTime(s.start)} y pregúntame en qué tarea lo quiero usar.`,
                  )
                }
                style={({ pressed }) => [styles.slot, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.slotTime}>
                  {fmtTime(s.start)} – {fmtTime(s.end)}
                </Text>
                <Text style={styles.slotHint}>Agendar</Text>
              </Pressable>
            ))
          ),
        )}
      </Card>

      <Collapsible
        title="Rutinas y racha"
        icon="flame"
        storageKey="home_routines"
        summary={
          streak === undefined ? undefined : `${streak} ${streak === 1 ? "día seguido" : "días seguidos"}`
        }
      >
        <Card title="Tu semana" icon="calendar">
          {body(routines, 2, renderRoutines)}
        </Card>
        {(readAlerts.length > 0 || !!alerts.error) && (
          <Card title="Avisos anteriores" icon="bell">
            {body(alerts, 1, () => readAlerts.slice(0, 5).map(renderAlert))}
          </Card>
        )}
      </Collapsible>

      <Text style={styles.srOnly} aria-live="polite">
        {announcement}
      </Text>
      </View>
    </ScrollView>
  );
}
