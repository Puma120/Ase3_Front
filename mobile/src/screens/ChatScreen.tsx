import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { headingLevel } from "../components/a11y";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { plainText, RichText } from "../components/RichText";
import { runDeviceCommands } from "../native/deviceCommands";
import { ApiError } from "../services/apiClient";
import { getHistory, sendMessage } from "../services/chatApi";
import { getItem, removeItem, setItem } from "../services/localStore";
import { contentMaxWidth, minTouchTarget, radius, spacing } from "../theme/tokens";
import { useReducedMotion } from "../theme/useReducedMotion";
import { useStyles, useTheme } from "../theme/useTheme";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  /** El mensaje no llego al asistente: se conserva y se puede reintentar. */
  failed?: boolean;
}

/** Mensaje que otra pantalla (atajos de Inicio) pide enviar ya. */
export interface OutgoingMessage {
  text: string;
  nonce: number;
}

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Hola, soy tu asistente. Puedo ayudarte a:\n- agendar en tu calendario\n- crear y dividir tareas\n- revisar tu correo\n- poner una alarma\n\n¿En qué te ayudo?",
};

// Atajos para arrancar sin pensar que escribir (menos carga de decision).
const SUGGESTIONS = [
  "¿Qué tengo pendiente hoy?",
  "Divide mi tarea más grande en pasos",
  "Busca un hueco libre para trabajar 25 minutos",
  "Resúmeme mis correos recientes",
];

const DRAFT_KEY = "ase3_chat_draft";

let nextId = 0;

// Pantalla central del producto: chat con el agente (Objetivo especifico 1
// del PDF - interfaz para organizar actividades por conversacion). Una sola
// lista, un solo input, una sola accion a la vez.
export function ChatScreen({ active, outgoing }: { active: boolean; outgoing: OutgoingMessage | null }) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const styles = useStyles((c, t) => ({
    flex: { flex: 1, backgroundColor: c.background },
    column: { flex: 1, width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" },
    header: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    title: { color: c.text, fontSize: t.lg, fontWeight: "800" },
    list: { padding: spacing.md, gap: spacing.sm },
    bubbleRow: { flexDirection: "row" },
    bubbleRowUser: { justifyContent: "flex-end" },
    bubble: {
      maxWidth: "85%",
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
    },
    bubbleAssistant: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderBottomLeftRadius: radius.sm,
    },
    bubbleUser: { backgroundColor: c.primary, borderBottomRightRadius: radius.sm },
    // Sin opacidad (bajaria el contraste): borde punteado y fondo neutro.
    bubbleFailed: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: c.danger,
    },
    bubbleText: { color: c.text, fontSize: t.md, lineHeight: t.line(t.md) },
    bubbleTextUser: { color: c.onPrimary },
    thinking: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    mutedText: { color: c.textMuted, fontSize: t.sm },
    chips: { gap: spacing.sm, paddingTop: spacing.sm },
    chip: {
      minHeight: minTouchTarget,
      justifyContent: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipText: { color: c.text, fontSize: t.md },
    errorBox: { gap: spacing.sm, alignItems: "flex-end" },
    errorRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    errorText: { color: c.danger, fontSize: t.sm, lineHeight: t.line(t.sm) },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: spacing.sm,
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.background,
    },
    input: {
      flex: 1,
      minHeight: minTouchTarget,
      maxHeight: 120,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      color: c.text,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      fontSize: t.md,
    },
    sendBtn: {
      minWidth: minTouchTarget,
      height: minTouchTarget,
      flexDirection: "row",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    sendBtnDisabled: { opacity: 0.4 },
    sendText: { color: c.onPrimary, fontSize: t.md, fontWeight: "700" },
    // Solo para lectores de pantalla: anuncia cada respuesta nueva.
    srOnly: { position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 },
  }));

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [draft, setDraft] = useState(() => getItem(DRAFT_KEY) ?? "");
  const [sending, setSending] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const sendingRef = useRef(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const lastNonce = useRef<number | null>(null);

  // Al volver a la app se ve la conversacion anterior (decision 5).
  useEffect(() => {
    getHistory(30)
      .then((history) => {
        const restored = history.map<ChatMessage>((h) => ({
          id: `h${nextId++}`,
          role: h.role,
          text: h.content,
        }));
        setMessages((prev) => [...restored, ...prev]);
        setShowWelcome(!restored.length);
      })
      .catch(() => setShowWelcome(true))
      .finally(() => setHistoryLoaded(true));
  }, []);

  // El borrador se guarda en el dispositivo mientras se escribe.
  useEffect(() => {
    const id = setTimeout(() => (draft ? setItem(DRAFT_KEY, draft) : removeItem(DRAFT_KEY)), 400);
    return () => clearTimeout(id);
  }, [draft]);

  useEffect(() => {
    if (active) listRef.current?.scrollToEnd({ animated: false });
  }, [active]);

  async function send(raw: string, fromDraft: boolean) {
    const text = raw.trim();
    if (!text || sendingRef.current) return;
    sendingRef.current = true;

    const id = String(nextId++);
    // Un reintento quita el mensaje fallido: se vuelve a agregar abajo.
    setMessages((prev) => [
      ...prev.filter((m) => !(m.failed && m.text === text)),
      { id, role: "user", text },
    ]);
    if (fromDraft) setDraft("");
    setSending(true);
    setAnnouncement("");

    try {
      const reply = await sendMessage(text);
      const notes = await runDeviceCommands(reply.device_commands);
      const full = notes.length ? `${reply.response}\n\n${notes.join("\n")}` : reply.response;
      setMessages((prev) => [...prev, { id: String(nextId++), role: "assistant", text: full }]);
      announce(`El asistente respondió: ${plainText(full)}`);
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, failed: true } : m)));
      announce(
        err instanceof ApiError
          ? "El asistente no pudo responder. Toca Reintentar."
          : "No se envió el mensaje. Revisa tu conexión y toca Reintentar.",
      );
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  function announce(text: string) {
    setAnnouncement(text);
    if (Platform.OS !== "web") AccessibilityInfo.announceForAccessibility(text);
  }

  // Atajos de Inicio: se envian en cuanto llegan, sin tocar el borrador.
  useEffect(() => {
    if (!outgoing || outgoing.nonce === lastNonce.current) return;
    lastNonce.current = outgoing.nonce;
    send(outgoing.text, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outgoing]);

  const failed = messages.find((m) => m.failed);
  const hasUserMessages = messages.some((m) => m.role === "user");
  const data = showWelcome ? [WELCOME, ...messages] : messages;
  const canSend = !!draft.trim() && !sending;

  function footer() {
    if (!historyLoaded) return <Text style={styles.mutedText}>Cargando tu conversación…</Text>;
    if (sending)
      return (
        <View style={styles.bubbleRow}>
          <View style={[styles.bubble, styles.bubbleAssistant, styles.thinking]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.mutedText}>Pensando…</Text>
          </View>
        </View>
      );
    if (failed)
      return (
        <View style={styles.errorBox}>
          <View style={styles.errorRow}>
            <Icon name="alert" size={16} color={colors.danger} />
            <Text accessibilityRole="alert" style={styles.errorText}>
              Este mensaje no se envió.
            </Text>
          </View>
          <Button
            variant="secondary"
            icon="refresh"
            label="Reintentar"
            onPress={() => send(failed.text, false)}
          />
        </View>
      );
    if (!hasUserMessages)
      return (
        <View style={styles.chips}>
          <Text style={styles.mutedText}>Prueba con:</Text>
          {SUGGESTIONS.map((s) => (
            <Pressable
              key={s}
              accessibilityRole="button"
              onPress={() => send(s, false)}
              style={({ pressed }) => [styles.chip, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.chipText}>{s}</Text>
            </Pressable>
          ))}
        </View>
      );
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.column}>
        <View style={styles.header}>
          <Text accessibilityRole="header" {...headingLevel(1)} style={styles.title}>
            Chat con tu asistente
          </Text>
        </View>

        <FlatList
          ref={listRef}
          style={styles.flex}
          contentContainerStyle={styles.list}
          data={data}
          keyExtractor={(item) => item.id}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: !reducedMotion })}
          renderItem={({ item }) => {
            const isUser = item.role === "user";
            return (
              <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
                <View
                  style={[
                    styles.bubble,
                    isUser ? styles.bubbleUser : styles.bubbleAssistant,
                    item.failed && styles.bubbleFailed,
                  ]}
                >
                  {isUser ? (
                    <Text style={[styles.bubbleText, !item.failed && styles.bubbleTextUser]} selectable>
                      {item.text}
                    </Text>
                  ) : (
                    <RichText text={item.text} style={styles.bubbleText} />
                  )}
                </View>
              </View>
            );
          }}
          ListFooterComponent={footer()}
        />

        <Text style={styles.srOnly} aria-live="polite">
          {announcement}
        </Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Escribe un mensaje"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Mensaje para el asistente"
            multiline
            onKeyPress={(e) => {
              // Web: Enter envia, Shift+Enter inserta salto de linea.
              const ev = e.nativeEvent as unknown as { key: string; shiftKey?: boolean };
              if (Platform.OS === "web" && ev.key === "Enter" && !ev.shiftKey) {
                e.preventDefault();
                send(draft, true);
              }
            }}
          />
          <Pressable
            accessibilityRole="button"
            disabled={!canSend}
            accessibilityState={{ disabled: !canSend }}
            onPress={() => send(draft, true)}
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
          >
            <Icon name="send" size={18} color={colors.onPrimary} />
            <Text style={styles.sendText}>Enviar</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
