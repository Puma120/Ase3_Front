import { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, IconName } from "../components/Icon";
import { RoutineSyncPrompt } from "../components/RoutineSyncPrompt";
import { UpdatePrompt } from "../components/UpdatePrompt";
import { minTouchTarget, radius, spacing } from "../theme/tokens";
import { useStyles, useTheme } from "../theme/useTheme";
import { resumeLocation } from "../native/location";
import { offerPushOnce, resumePush } from "../native/push";
import { refreshToken } from "../services/authApi";
import { setToken } from "../services/authStore";
import { getItem, setItem } from "../services/localStore";
import { getOnboarding, skipOnboarding } from "../services/chatApi";
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
// TEMPORAL (prueba de usabilidad): siempre abrir en Inicio. Poner en false
// para volver a abrir la ultima pestana usada.
const ALWAYS_OPEN_HOME = true;

function initialTab(): Tab {
  if (ALWAYS_OPEN_HOME) return "home";
  const stored = getItem(TAB_KEY);
  return tabFromHash() ?? (isTab(stored) ? stored : "home");
}

export function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useStyles((c, t) => ({
    flex: { flex: 1, backgroundColor: c.background },
    content: { flex: 1 },
    // Chat y Ajustes arrancan bajo la barra de estado; Inicio la cubre con su cielo.
    padded: { paddingTop: insets.top },
    // El onboarding no tiene barra de pestanas: reserva el margen de la barra del sistema (3 botones).
    paddedFull: { paddingTop: insets.top, paddingBottom: insets.bottom },
    hidden: { display: "none" },
    tabList: { flex: 1, flexDirection: "row" },
    tabBar: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: c.border,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      backgroundColor: c.surface,
      paddingBottom: insets.bottom,
    },
    // Pestana activa: regla de tinta arriba, icono y texto en tinta y negrita.
    tabPill: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      marginTop: spacing.xs,
    },
    tabPillActive: { backgroundColor: c.highlight },
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
  // el usuario ya los activo en Ajustes. La primera vez, offerPushOnce
  // pregunta (una sola vez) si quiere activarlos; el permiso solo se pide si acepta.
  useEffect(() => {
    // Renovacion deslizante: cada vez que entran, el JWT vuelve a tener 30 dias.
    refreshToken().then(setToken).catch(() => {});
    heartbeat().catch(() => {});
    resumePush().then(offerPushOnce).catch(() => {});
    resumeLocation().catch(() => {});
  }, []);

  // Primera vez (o desde Ajustes): el agente entrevista al usuario sobre su rutina.
  // Se muestra a pantalla completa; si la consulta falla no se bloquea la app.
  const [onboarding, setOnboarding] = useState(false);
  useEffect(() => {
    getOnboarding()
      .then((status) => status === "pending" && setOnboarding(true))
      .catch(() => {});
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
    if (isWeb) document.title = `${TABS.find((t) => t.key === tab)!.title} · Oportuno`;
  }, [tab]);

  // Los atajos de Inicio mandan su mensaje de inmediato (un toque) y no
  // tocan el borrador que el usuario estuviera escribiendo.
  function handleQuickAction(text: string) {
    setOutgoing({ text, nonce: Date.now() });
    goTo("chat");
  }

  if (onboarding)
    return (
      <View style={[styles.flex, styles.paddedFull]}>
        <ChatScreen
          active
          outgoing={null}
          onboarding={{
            onFinish: () => setOnboarding(false),
            onSkip: () => {
              skipOnboarding().catch(() => {});
              setOnboarding(false);
            },
          }}
        />
      </View>
    );

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
        <View style={[styles.content, styles.padded, tab !== "chat" && styles.hidden]}>
          <ChatScreen active={tab === "chat"} outgoing={outgoing} />
        </View>
        <View style={[styles.content, styles.padded, tab !== "settings" && styles.hidden]}>
          <SettingsScreen active={tab === "settings"} onStartOnboarding={() => setOnboarding(true)} />
        </View>
      </View>

      <UpdatePrompt />
      <RoutineSyncPrompt />

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
                <View style={[styles.tabPill, active && styles.tabPillActive]}>
                  <Icon name={icon} size={22} color={active ? colors.onHighlight : colors.textMuted} />
                </View>
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
