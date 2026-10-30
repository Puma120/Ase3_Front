import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { getCalendarSync, getOnboarding, skipCalendarSync, syncRoutine } from "../services/chatApi";
import { useStyles } from "../theme/useTheme";
import { minTouchTarget, radius, spacing } from "../theme/tokens";
import { Button } from "./Button";
import { plainText } from "./RichText";

const PERIODS = [
  { label: "1 mes", months: 1 },
  { label: "3 meses", months: 3 },
  { label: "6 meses (un semestre)", months: 6 },
  { label: "1 año", months: 12 },
];

type Step = "hidden" | "ask" | "working" | "done";

function untilDate(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Pop-up de una sola vez: la rutina que el agente ya aprendio vive en su memoria,
// no en el calendario. Si el usuario acepta, el agente la agenda por el plazo elegido.
export function RoutineSyncPrompt() {
  const [step, setStep] = useState<Step>("hidden");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    // Con la platica inicial pendiente no se ofrece: esa pantalla ya agenda por su cuenta.
    getOnboarding()
      .then((onboarding) => (onboarding === "pending" ? "none" : getCalendarSync()))
      .then((status) => alive && status === "pending" && setStep("ask"))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const styles = useStyles((c, t) => ({
    backdrop: { flex: 1, justifyContent: "center", padding: spacing.md, backgroundColor: "rgba(0,0,0,0.55)" },
    card: {
      gap: spacing.sm,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    title: { color: c.text, fontSize: t.lg, fontWeight: "800" },
    text: { color: c.textMuted, fontSize: t.md },
    result: { color: c.text, fontSize: t.md },
    error: { color: c.text, fontSize: t.sm, fontWeight: "700" },
    later: { minHeight: minTouchTarget, alignItems: "center", justifyContent: "center" },
    laterText: { color: c.text, fontSize: t.md, fontWeight: "600", textDecorationLine: "underline" },
  }));

  if (step === "hidden") return null;

  async function run(months: number) {
    setStep("working");
    setError("");
    try {
      const reply = await syncRoutine(untilDate(months));
      setResult(plainText(reply.response));
      setStep("done");
    } catch {
      setError("No se pudo agendar. Revisa tu conexión e inténtalo otra vez.");
      setStep("ask");
    }
  }

  function later() {
    skipCalendarSync().catch(() => {});
    setStep("hidden");
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={() => step === "ask" && later()}>
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal style={styles.card}>
          {step === "done" ? (
            <>
              <Text accessibilityRole="header" style={styles.title}>
                Tu rutina ya está en el calendario
              </Text>
              <Text style={styles.result}>{result}</Text>
              <Button label="Listo" onPress={() => setStep("hidden")} />
            </>
          ) : (
            <>
              <Text accessibilityRole="header" style={styles.title}>
                ¿Agendo tu rutina en tu calendario?
              </Text>
              <Text style={styles.text}>
                Ya conozco tu rutina, pero aún no está en tu Google Calendar. Dime por cuánto tiempo la agendo
                (trabajo, clases y demás horas fijas).
              </Text>
              {!!error && <Text style={styles.error}>{error}</Text>}
              {step === "working" ? (
                <Button label="Agendar" loading loadingLabel="Agendando tu rutina..." onPress={() => {}} />
              ) : (
                <>
                  {PERIODS.map(({ label, months }) => (
                    <Button key={months} variant="secondary" label={label} onPress={() => run(months)} />
                  ))}
                  <Pressable accessibilityRole="button" onPress={later} style={styles.later}>
                    <Text style={styles.laterText}>Ahora no</Text>
                  </Pressable>
                </>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
