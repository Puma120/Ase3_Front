import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { Icon } from "../components/Icon";
import { ApiError } from "../services/apiClient";
import { sendMessage } from "../services/chatApi";
import { contentMaxWidth, fontSize, minTouchTarget, radius, spacing } from "../theme/tokens";
import { useStyles, useTheme } from "../theme/useTheme";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Hola, soy tu asistente. Puedo ayudarte a agendar, crear tareas, revisar tu correo o poner una alarma. ¿En qué te ayudo?",
};

// Atajos para arrancar sin pensar que escribir (menos carga de decision).
const SUGGESTIONS = [
  "¿Qué tengo pendiente hoy?",
  "Divide mi tarea más grande en pasos",
  "Busca un hueco libre para trabajar 25 minutos",
  "Resúmeme mis correos recientes",
];

let nextId = 0;

// Pantalla central del producto: chat con el agente (Objetivo especifico 1
// del PDF - interfaz para organizar actividades por conversacion). Una sola
// lista, un solo input, una sola accion a la vez.
export function ChatScreen({
  prefillMessage,
  prefillNonce,
}: {
  prefillMessage: string;
  prefillNonce: number;
}) {
  const { colors } = useTheme();
  const styles = useStyles((c) => ({
    flex: { flex: 1, backgroundColor: c.background },
    column: { flex: 1, width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" },
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
    bubbleText: { color: c.text, fontSize: fontSize.md, lineHeight: 21 },
    bubbleTextUser: { color: c.onPrimary },
    chips: { gap: spacing.sm, paddingTop: spacing.sm },
    chipsLabel: { color: c.textMuted, fontSize: fontSize.sm },
    chip: {
      minHeight: minTouchTarget,
      justifyContent: "center",
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipText: { color: c.text, fontSize: fontSize.md },
    typingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    typingText: { color: c.textMuted, fontSize: fontSize.sm },
    error: {
      color: c.danger,
      fontSize: fontSize.sm,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
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
      fontSize: fontSize.md,
    },
    sendBtn: {
      width: minTouchTarget,
      height: minTouchTarget,
      borderRadius: radius.pill,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    sendBtnDisabled: { opacity: 0.4 },
  }));

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (!prefillMessage) return;
    setDraft(prefillMessage);
    setError("");
  }, [prefillMessage, prefillNonce]);

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { id: String(nextId++), role: "user", text }]);
    setDraft("");
    setError("");
    setSending(true);

    try {
      const response = await sendMessage(text);
      setMessages((prev) => [...prev, { id: String(nextId++), role: "assistant", text: response }]);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? "El asistente no pudo responder ahora mismo."
          : "No se pudo conectar con el servidor.",
      );
    } finally {
      setSending(false);
    }
  }

  const canSend = !!draft.trim() && !sending;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.column}>
        <FlatList
          ref={listRef}
          style={styles.flex}
          contentContainerStyle={styles.list}
          data={messages}
          keyExtractor={(item) => item.id}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isUser = item.role === "user";
            return (
              <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
                  <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]} selectable>
                    {item.text}
                  </Text>
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            messages.length === 1 ? (
              <View style={styles.chips}>
                <Text style={styles.chipsLabel}>Prueba con:</Text>
                {SUGGESTIONS.map((s) => (
                  <Pressable
                    key={s}
                    accessibilityRole="button"
                    onPress={() => send(s)}
                    style={({ pressed }) => [styles.chip, pressed && { opacity: 0.8 }]}
                  >
                    <Text style={styles.chipText}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null
          }
        />

        {sending && (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.typingText}>Pensando…</Text>
          </View>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Escribe un mensaje"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Mensaje"
            multiline
            onKeyPress={(e) => {
              // Web: Enter envia, Shift+Enter inserta salto de linea.
              const ev = e.nativeEvent as unknown as { key: string; shiftKey?: boolean };
              if (Platform.OS === "web" && ev.key === "Enter" && !ev.shiftKey) {
                e.preventDefault();
                send(draft);
              }
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enviar"
            disabled={!canSend}
            onPress={() => send(draft)}
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
          >
            <Icon name="send" size={20} color={colors.onPrimary} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
