import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { apiFetch, ApiError } from "../services/apiClient";
import { colors, fontSize, minTouchTarget, radius, spacing } from "../theme/tokens";

type FreeSlot = {
  start: string;
  end: string;
};

type FreeSlotsRequest = {
  window_start: string;
  window_end: string;
  duration_minutes: number;
};

// Dashboard v2 (real): muestra huecos libres consultando el calendario.
// Esto cumple el caso "A" (sin endpoint para listar tareas creadas) y se
// alinea con /tools/calendar/free-slots.
export function HomeDashboard({
  onQuickAction,
}: {
  onQuickAction: (prompt: string) => void;
}) {
  const [slots, setSlots] = useState<FreeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // No hacemos timezone math complejo: el backend usa timezone en
    // user_settings para calendarios; aquí solo abrimos una ventana razonable
    // para "hoy".
    const start = new Date();
    start.setMinutes(start.getMinutes() - start.getSeconds());
    const end = new Date(start);
    end.setHours(end.getHours() + 6);

    const payload: FreeSlotsRequest = {
      window_start: start.toISOString(),
      window_end: end.toISOString(),
      duration_minutes: 25,
    };

    setLoading(true);
    setError("");

    apiFetch<FreeSlot[]>("/tools/calendar/free-slots", {
      method: "POST",
      body: JSON.stringify(payload),
    })
      .then(setSlots)
      .catch((err) => {
        setSlots([]);
        setError(err instanceof ApiError ? err.message : "No se pudieron cargar los huecos.");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Inicio</Text>
        <Text style={styles.subtitle}>Tu siguiente paso, con menos fricción.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Próximo hueco libre (25 min)</Text>

        {loading && (
          <View style={styles.centerRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.muted}>Consultando calendario…</Text>
          </View>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}

        {!loading && !error && slots.length === 0 && (
          <Text style={styles.muted}>No encontré huecos cercanos en la ventana de hoy.</Text>
        )}

        {!loading && !error && slots.length > 0 && (
          <View style={styles.slotList}>
            {slots.slice(0, 3).map((s, idx) => (
              <Pressable
                key={idx}
                style={({ pressed }) => [styles.slotRow, pressed && { opacity: 0.8 }]}
                android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                accessibilityRole="button"
              >
                <Text style={styles.slotTime}>{formatTimeRange(s.start, s.end)}</Text>
                <Text style={styles.slotHint}>Sugerencia lista</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Acciones rápidas</Text>

        <QuickAction
          label="Dividir tarea"
          onPress={() =>
            onQuickAction(
              "Ayúdame a dividir una tarea grande en subtareas accionables para evitar la parálisis por análisis. Empieza preguntándome qué tarea es y cuánto tiempo toma."
            )
          }
        />
        <QuickAction
          label="Poner alarma"
          onPress={() =>
            onQuickAction(
              "Quiero poner una alarma para mi siguiente evento. Pregúntame qué evento es y a qué hora quiero empezar a prepararme."
            )
          }
        />
        <QuickAction
          label="Modo enfoque"
          onPress={() =>
            onQuickAction(
              "Quiero activar el modo de enfoque (No Molestar) para un periodo. Pregúntame duración y horario, y confirma antes de activarlo."
            )
          }
        />
      </View>

      <View style={styles.footerSpace} />
    </ScrollView>
  );
}

function QuickAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.action, pressed && { opacity: 0.85 }]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

function formatTimeRange(startIso: string, endIso: string) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${fmt(s)} - ${fmt(e)}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  header: { gap: spacing.xs },
  title: { fontSize: fontSize.xl, color: colors.text, fontWeight: "800" },
  subtitle: { color: colors.textMuted, fontSize: fontSize.sm },
  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: "700" },
  muted: { color: colors.textMuted, fontSize: fontSize.sm },
  error: { color: colors.danger, fontSize: fontSize.sm },
  centerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  slotList: { gap: spacing.sm },
  slotRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: minTouchTarget,
    justifyContent: "center",
    gap: 2,
  },
  slotTime: { color: colors.text, fontSize: fontSize.md, fontWeight: "600" },
  slotHint: { color: colors.textMuted, fontSize: fontSize.sm },
  action: {
    minHeight: minTouchTarget,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  actionText: { color: colors.text, fontSize: fontSize.md, fontWeight: "700" },
  footerSpace: { height: spacing.xl },
});
