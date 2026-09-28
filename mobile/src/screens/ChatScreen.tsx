import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Button } from "../components/Button";
import { colors, fontSize, minTouchTarget, radius, spacing } from "../theme/tokens";
import { ApiError } from "../services/apiClient";
import { sendMessage } from "../services/chatApi";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

let nextId = 0;

// Pantalla central del producto: chat con el agente (Objetivo especifico 1
// del PDF - interfaz para organizar actividades por conversacion). Una sola
// lista, un solo input, una sola accion a la vez - sin menus ni tabs que
// distraigan.
export function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hola, soy tu asistente. Puedo ayudarte a agendar, crear tareas, revisar tu correo o poner una alarma. En que te ayudo?",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending) return;

    const userMessage: ChatMessage = { id: String(nextId++), role: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setDraft("");
    setError("");
    setSending(true);

    try {
      const response = await sendMessage(text);
      setMessages((prev) => [
        ...prev,
        { id: String(nextId++), role: "assistant", text: response },
      ]);
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

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FlatList
        style={styles.flex}
        contentContainerStyle={styles.list}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Bubble message={item} />}
      />

      {sending && (
        <View style={styles.typingRow}>
          <ActivityIndicator size="small" color={colors.textMuted} />
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
          multiline
          onSubmitEditing={handleSend}
        />
        <Button label="Enviar" onPress={handleSend} disabled={!draft.trim() || sending} />
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={styles.bubbleText}>{message.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  bubbleRow: {
    flexDirection: "row",
  },
  bubbleRowUser: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "80%",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  bubbleAssistant: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.sm,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.sm,
  },
  bubbleText: {
    color: colors.text,
    fontSize: fontSize.md,
    lineHeight: 20,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  typingText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: minTouchTarget,
    maxHeight: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
  },
});
