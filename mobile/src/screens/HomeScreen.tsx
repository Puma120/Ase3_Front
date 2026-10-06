import { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, Platform, Pressable, Text, View } from "react-native";

import { Icon, IconName } from "../components/Icon";
import { minTouchTarget, spacing } from "../theme/tokens";
import { useStyles, useTheme } from "../theme/useTheme";
import { resumeLocation } from "../native/location";
import { resumePush } from "../native/push";
import { refreshToken } from "../services/authApi";
import { setToken } from "../services/authStore";
import { getItem, setItem } from "../services/localStore";
import { heartbeat } from "../services/proactiveApi";
import { ChatScreen, OutgoingMessage } from "./ChatScreen";
import { HomeDashboard } from "./HomeDashboard";
import { SettingsScreen } from "./SettingsScreen";

type Tab = "home" | "chat" | "settings";

const TABS: { key: Tab; label: string; icon: IconName; hash: string; title: string }[] = [
  { key: "home", label: "Inicio", icon: "home", hash: "#inicio", title: "Inicio" },
  { key: "chat", label: "Chat", icon: "chat", hash: "#chat", title: "Chat" },
  { key: "settings", label: "Ajustes", icon: "settings", hash: "#ajustes", title: "Ajustes" },
];

const TAB_KEY = "ase3_tab";
const isWeb = Platform.OS === "web";

const isTab = (value: unknown): value is Tab => TABS.some((t) => t.key === value);
const tabFromHash = (): Tab | null =>
  isWeb ? (TABS.find((t) => t.hash === window.location.hash)?.key ?? null) : null;

// Al volver a la app se abre la ultima pestana usada (decision 5): en web
// manda la URL (#chat), si no, lo guardado en el dispositivo.
function initialTab(): Tab {
  const stored = getItem(TAB_KEY);
  return tabFromHash() ?? (isTab(stored) ? stored : "home");
}

export function HomeScreen() {
  const { colors } = useTheme();
  const styles = useStyles((c, t) => ({
    flex: { flex: 1, backgroundColor: c.background },
    content: { flex: 1 },
    hidden: { display: "none" },
    tabList: { flex: 1, flexDirection: "row" },
    tabBar: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.surface,
    },
    // Pestana activa: regla de tinta arriba, icono y texto en tinta y negrita.
    tabRule: { height: 4, width: "100%", backgroundColor: "transparent", marginBottom: spacing.xs },
    tabRuleActive: { backgroundColor: c.primary },
    tabButton: {
      flex: 1,
      minHeight: minTouchTarget + spacing.md,
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 2,
      paddingBottom: spacing.xs,
    },
    tabLabel: { color: c.textMuted, fontSize: t.xs, fontWeight: "600" },
    tabLabelActive: { color: c.text, fontWeight: "800" },
  }));

  // Motor proactivo: al entrar se marca al usuario como activo (el tick solo
  // atiende usuarios activos) y se retoman los avisos y la ubicacion SOLO si
  // el usuario ya los activo en Ajustes: abrir la app nunca pide permisos.
  useEffect(() => {
    // Renovacion deslizante: cada vez que entran, el JWT vuelve a tener 30 dias.
    refreshToken().then(setToken).catch(() => {});
    heartbeat().catch(() => {});
    resumePush().catch(() => {});
    resumeLocation().catch(() => {});
  }, []);

  const [tab, setTab] = useState<Tab>(initialTab);
  const tabRef = useRef(tab);
  tabRef.current = tab;
  const [outgoing, setOutgoing] = useState<OutgoingMessage | null>(null);

  const showTab = useCallback((next: Tab) => {
    setTab(next);
    setItem(TAB_KEY, next);
  }, []);

  // Cambiar de pestana deja una entrada en el historial del navegador, para
  // que "atras" vuelva a la pestana anterior en vez de salir de la app.
  const goTo = useCallback(
    (next: Tab) => {
      if (next === tabRef.current) return;
      showTab(next);
      if (isWeb) window.history.pushState(null, "", TABS.find((t) => t.key === next)!.hash);
    },
    [showTab],
  );

  useEffect(() => {
    if (isWeb) {
      window.history.replaceState(null, "", TABS.find((t) => t.key === tabRef.current)!.hash);
      const onPop = () => showTab(tabFromHash() ?? "home");
      window.addEventListener("popstate", onPop);
      return () => window.removeEventListener("popstate", onPop);
    }
    // Android: el boton atras regresa a Inicio antes de salir de la app.
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (tabRef.current === "home") return false;
      showTab("home");
      return true;
    });
    return () => sub.remove();
  }, [showTab]);

  useEffect(() => {
    if (isWeb) document.title = `${TABS.find((t) => t.key === tab)!.title} · Agente TDAH`;
  }, [tab]);

  // Los atajos de Inicio mandan su mensaje de inmediato (un toque) y no
  // tocan el borrador que el usuario estuviera escribiendo.
  function handleQuickAction(text: string) {
    setOutgoing({ text, nonce: Date.now() });
    goTo("chat");
  }

  // Las tres pantallas quedan montadas y solo se ocultan: al cambiar de
  // pestana no se pierde la conversacion, el borrador ni el scroll.
  return (
    <View style={styles.flex}>
      <View role="main" style={styles.content}>
        <View style={[styles.content, tab !== "home" && styles.hidden]}>
          <HomeDashboard
            active={tab === "home"}
            onQuickAction={handleQuickAction}
            onOpenSettings={() => goTo("settings")}
          />
        </View>
        <View style={[styles.content, tab !== "chat" && styles.hidden]}>
          <ChatScreen active={tab === "chat"} outgoing={outgoing} />
        </View>
        <View style={[styles.content, tab !== "settings" && styles.hidden]}>
          <SettingsScreen active={tab === "settings"} />
        </View>
      </View>

      <View role="navigation" aria-label="Pantallas de la app" style={styles.tabBar}>
        <View accessibilityRole="tablist" style={styles.tabList}>
          {TABS.map(({ key, label, icon }) => {
            const active = tab === key;
            return (
              <Pressable
                key={key}
                accessibilityRole="tab"
                aria-selected={active}
                style={styles.tabButton}
                onPress={() => goTo(key)}
              >
                <View style={[styles.tabRule, active && styles.tabRuleActive]} />
                <Icon name={icon} size={22} color={active ? colors.text : colors.textMuted} />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
