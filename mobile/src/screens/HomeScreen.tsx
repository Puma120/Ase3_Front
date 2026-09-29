import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "../components/ScreenContainer";
import { ChatScreen } from "./ChatScreen";
import { SettingsScreen } from "./SettingsScreen";
import { HomeDashboard } from "./HomeDashboard";
import { colors, fontSize, minTouchTarget, spacing } from "../theme/tokens";

type Tab = "home" | "chat" | "settings";

export function HomeScreen() {
  const [tab, setTab] = useState<Tab>("home");

  return (
    <View style={styles.flex}>
      <View style={styles.content}>
        {tab === "home" ? <HomeDashboard /> : tab === "chat" ? <ChatScreen /> : <SettingsScreen />}
      </View>

      <View style={styles.tabBar}>
        <TabButton label="Inicio" active={tab === "home"} onPress={() => setTab("home")} />
        <TabButton label="Chat" active={tab === "chat"} onPress={() => setTab("chat")} />
        <TabButton
          label="Ajustes"
          active={tab === "settings"}
          onPress={() => setTab("settings")}
        />
      </View>
    </View>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.tabButton} onPress={onPress}>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabButton: {
    flex: 1,
    minHeight: minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: colors.primary,
  },
});
