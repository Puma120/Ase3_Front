import { ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "../components/Button";
import { Card, MutedText } from "../components/Card";
import { Icon, IconName } from "../components/Icon";
import {
  completeTask,
  getFreeSlots,
  getPendingTasks,
  getRoutinesSummary,
  getSuggestion,
  getTodayEvents,
  RoutinesSummary,
  TaskItem,
} from "../services/homeApi";
import { getMe } from "../services/authApi";
import { Resource, useResource } from "../services/useResource";
import { contentMaxWidth, fontSize, minTouchTarget, radius, spacing } from "../theme/tokens";
import { useStyles, useTheme } from "../theme/useTheme";

const QUICK_ACTIONS: { label: string; icon: IconName; prompt: string }[] = [
  {
    label: "Dividir tarea",
    icon: "scissors",
    prompt:
      "Ayúdame a dividir una tarea grande en subtareas accionables para evitar la parálisis por análisis. Empieza preguntándome qué tarea es y cuánto tiempo toma.",
  },
  {
    label: "Poner alarma",
    icon: "bell",
    prompt:
      "Quiero poner una alarma para mi siguiente evento. Pregúntame qué evento es y a qué hora quiero empezar a prepararme.",
  },
  {
    label: "Modo enfoque",
    icon: "moon",
    prompt:
      "Quiero activar el modo de enfoque (No Molestar) para un periodo. Pregúntame duración y horario, y confirma antes de activarlo.",
  },
];

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

// Inicio: todo lo que importa hoy en una sola columna, de mayor a menor
// urgencia (sugerencia -> agenda -> tareas -> racha -> huecos -> atajos).
export function HomeDashboard({
  onQuickAction,
  onOpenSettings,
}: {
  onQuickAction: (prompt: string) => void;
  onOpenSettings: () => void;
}) {
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
    header: { gap: 2, paddingVertical: spacing.sm },
    title: { color: c.text, fontSize: fontSize.xl, fontWeight: "800" },
    date: { color: c.textMuted, fontSize: fontSize.sm },
    suggestion: {
      backgroundColor: c.primarySoft,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.primary,
      padding: spacing.md,
      gap: spacing.sm,
    },
    suggestionHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    suggestionTitle: { color: c.text, fontSize: fontSize.md, fontWeight: "700" },
    suggestionText: { color: c.text, fontSize: fontSize.md, lineHeight: 21 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      minHeight: minTouchTarget,
    },
    rowTime: { width: 96, color: c.textMuted, fontSize: fontSize.sm, fontVariant: ["tabular-nums"] },
    rowText: { flex: 1, color: c.text, fontSize: fontSize.md },
    check: {
      width: minTouchTarget,
      height: minTouchTarget,
      alignItems: "center",
      justifyContent: "center",
    },
    streakRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    streakNum: { color: c.text, fontSize: fontSize.xxl, fontWeight: "800" },
    streakLabel: { color: c.textMuted, fontSize: fontSize.sm },
    bars: { flex: 1, flexDirection: "row", alignItems: "flex-end", gap: 6, height: 48 },
    barCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 4, height: "100%" },
    bar: { width: "100%", borderRadius: 4 },
    barDay: { color: c.textMuted, fontSize: 10 },
    stats: { flexDirection: "row", gap: spacing.sm },
    stat: {
      flex: 1,
      backgroundColor: c.background,
      borderRadius: radius.md,
      padding: spacing.sm,
      alignItems: "center",
    },
    statNum: { color: c.text, fontSize: fontSize.lg, fontWeight: "700" },
    statLabel: { color: c.textMuted, fontSize: fontSize.xs, textAlign: "center" },
    slot: {
      minHeight: minTouchTarget,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    slotTime: { color: c.text, fontSize: fontSize.md, fontWeight: "600" },
    slotHint: { color: c.primary, fontSize: fontSize.sm, fontWeight: "600" },
    actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    action: {
      minHeight: minTouchTarget,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    actionText: { color: c.text, fontSize: fontSize.md, fontWeight: "600" },
    error: { color: c.danger, fontSize: fontSize.sm },
    loadingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  }));

  const me = useResource(getMe);
  const suggestion = useResource(getSuggestion);
  const events = useResource(getTodayEvents);
  const tasks = useResource(getPendingTasks);
  const routines = useResource(getRoutinesSummary);
  const slots = useResource(() => getFreeSlots());

  const firstName = me.data?.full_name.split(" ")[0];
  const todayRaw = new Date().toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const today = todayRaw.charAt(0).toUpperCase() + todayRaw.slice(1);

  // Envoltorio comun de estados: cargando / sin Google / error / contenido.
  function body<T>(r: Resource<T>, render: (data: T) => ReactNode) {
    if (r.loading)
      return (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <MutedText>Cargando…</MutedText>
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

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {greeting()}
          {firstName ? `, ${firstName}` : ""}
        </Text>
        <Text style={styles.date}>{today}</Text>
      </View>

      {!!suggestion.data && (
        <View style={styles.suggestion}>
          <View style={styles.suggestionHead}>
            <Icon name="sparkles" size={18} color={colors.primary} />
            <Text style={styles.suggestionTitle}>Sugerencia para ti</Text>
          </View>
          <Text style={styles.suggestionText}>{suggestion.data}</Text>
          <Button
            label="Hablar con el asistente"
            icon="chat"
            onPress={() => onQuickAction(suggestion.data ?? "")}
          />
        </View>
      )}

      <Card title="Agenda de hoy" icon="calendar">
        {body(events, (list) =>
          list.length === 0 ? (
            <MutedText>No tienes eventos hoy. Buen momento para avanzar una tarea.</MutedText>
          ) : (
            list.map((e) => (
              <View key={e.id} style={styles.row}>
                <Text style={styles.rowTime}>
                  {e.all_day ? "Todo el día" : `${fmtTime(e.start)} – ${fmtTime(e.end)}`}
                </Text>
                <Text style={styles.rowText} numberOfLines={2}>
                  {e.summary}
                </Text>
              </View>
            ))
          ),
        )}
      </Card>

      <Card title="Tareas pendientes" icon="checkCircle">
        {body(tasks, (list) => (
          <TaskList
            tasks={list}
            onComplete={async (id) => {
              const prev = list;
              tasks.setData((cur) => cur?.filter((t) => t.id !== id) ?? null);
              try {
                await completeTask(id);
                routines.reload();
              } catch {
                tasks.setData(() => prev);
              }
            }}
          />
        ))}
      </Card>

      <Card title="Rutinas y racha" icon="flame">
        {body(routines, (r) => (
          <RoutinesBlock summary={r} />
        ))}
      </Card>

      <Card title="Próximos huecos libres" icon="clock">
        {body(slots, (list) =>
          list.length === 0 ? (
            <MutedText>No hay huecos de 25 minutos en las próximas 6 horas.</MutedText>
          ) : (
            list.slice(0, 3).map((s) => (
              <Pressable
                key={s.start}
                accessibilityRole="button"
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

      <Card title="Acciones rápidas" icon="sparkles">
        <View style={styles.actions}>
          {QUICK_ACTIONS.map((a) => (
            <Pressable
              key={a.label}
              accessibilityRole="button"
              onPress={() => onQuickAction(a.prompt)}
              style={({ pressed }) => [styles.action, pressed && { opacity: 0.8 }]}
            >
              <Icon name={a.icon} size={18} color={colors.primary} />
              <Text style={styles.actionText}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </Card>
    </ScrollView>
  );

  function TaskList({
    tasks: list,
    onComplete,
  }: {
    tasks: TaskItem[];
    onComplete: (id: string) => void;
  }) {
    if (list.length === 0) return <MutedText>Sin tareas pendientes. Todo al día.</MutedText>;
    return (
      <>
        {list.slice(0, 6).map((t) => (
          <View key={t.id} style={styles.row}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel={`Completar ${t.title}`}
              onPress={() => onComplete(t.id)}
              style={styles.check}
            >
              <Icon name="circle" size={22} color={colors.textMuted} />
            </Pressable>
            <Text style={styles.rowText} numberOfLines={2}>
              {t.title}
            </Text>
          </View>
        ))}
        {list.length > 6 && <MutedText>y {list.length - 6} más</MutedText>}
      </>
    );
  }

  function RoutinesBlock({ summary }: { summary: RoutinesSummary }) {
    const max = Math.max(1, ...summary.week.map((d) => d.count));
    return (
      <>
        <View style={styles.streakRow}>
          <View>
            <Text style={styles.streakNum}>{summary.streak_days}</Text>
            <Text style={styles.streakLabel}>
              {summary.streak_days === 1 ? "día de racha" : "días de racha"}
            </Text>
          </View>
          <View style={styles.bars}>
            {summary.week.map((d) => (
              <View key={d.date} style={styles.barCol}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(4, (d.count / max) * 32),
                      backgroundColor: d.count > 0 ? colors.primary : colors.border,
                    },
                  ]}
                />
                <Text style={styles.barDay}>
                  {new Date(`${d.date}T12:00:00`).toLocaleDateString("es", { weekday: "narrow" })}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.stats}>
          <Stat n={summary.completed_week} label="completadas" />
          <Stat n={summary.created_week} label="creadas" />
          <Stat n={summary.scheduled_week} label="agendadas" />
        </View>
      </>
    );
  }

  function Stat({ n, label }: { n: number; label: string }) {
    return (
      <View style={styles.stat}>
        <Text style={styles.statNum}>{n}</Text>
        <Text style={styles.statLabel}>{label} (7 d)</Text>
      </View>
    );
  }
}
