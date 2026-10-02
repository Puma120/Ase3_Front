import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Icon, IconName } from "../components/Icon";
import { fontSize, minTouchTarget, spacing } from "../theme/tokens";
import { useStyles, useTheme } from "../theme/useTheme";
import { ChatScreen } from "./ChatScreen";
import { HomeDashboard } from "./HomeDashboard";
import { SettingsScreen } from "./SettingsScreen";

type Tab = "home" | "chat" | "settings";

const TABS: { key: Tab; label: string; icon: IconName }[] = [
  { key: "home", label: "Inicio", icon: "home" },
  { key: "chat", label: "Chat", icon: "chat" },
  { key: "settings", label: "Ajustes", icon: "settings" },
];

export function HomeScreen() {
  const { colors } = useTheme();
  const styles = useStyles((c) => ({
    flex: { flex: 1, backgroundColor: c.background },
    content: { flex: 1 },
    tabBar: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.surface,
    },
    tabButton: {
      flex: 1,
      minHeight: minTouchTarget + spacing.md,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
    },
    tabLabel: { color: c.textMuted, fontSize: fontSize.xs, fontWeight: "600" },
    tabLabelActive: { color: c.primary },
  }));

  const [tab, setTab] = useState<Tab>("home");
  const [chatPrefillMessage, setChatPrefillMessage] = useState("");
  const [chatPrefillNonce, setChatPrefillNonce] = useState(0);

  function handleQuickAction(prompt: string) {
    setChatPrefillMessage(prompt);
    setChatPrefillNonce((n) => n + 1);
    setTab("chat");
  }

  return (
    <View style={styles.flex}>
      <View style={styles.content}>
        {tab === "home" ? (
          <HomeDashboard
            onQuickAction={handleQuickAction}
            onOpenSettings={() => setTab("settings")}
          />
        ) : tab === "chat" ? (
          <ChatScreen prefillMessage={chatPrefillMessage} prefillNonce={chatPrefillNonce} />
        ) : (
          <SettingsScreen />
        )}
      </View>

      <View style={styles.tabBar} accessibilityRole="tablist">
        {TABS.map(({ key, label, icon }) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={styles.tabButton}
              onPress={() => setTab(key)}
            >
              <Icon name={icon} size={22} color={active ? colors.primary : colors.textMuted} />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
