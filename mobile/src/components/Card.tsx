import { PropsWithChildren, ReactNode, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { getJSON, setJSON } from "../services/localStore";
import { useStyles, useTheme } from "../theme/useTheme";
import { minTouchTarget, radius, spacing } from "../theme/tokens";
import { Icon, IconName } from "./Icon";

interface CardProps extends PropsWithChildren {
  title: string;
  icon: IconName;
  trailing?: ReactNode;
  /** Si se da, la Card se pliega a solo su titulo y recuerda el estado. */
  storageKey?: string;
}

// Contenedor de seccion unico (Home y Ajustes): icono + titulo arriba, el
// contenido debajo. Una sola forma de agrupar informacion en toda la app.
export function Card({ title, icon, trailing, storageKey, children }: CardProps) {
  const { colors } = useTheme();
  const styles = useStyles((c, t) => ({
    // Superficie suave: esquinas amplias, filete calido y sombra tintada.
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      gap: spacing.sm,
      ...(c.shadow ? { boxShadow: c.shadow } : null),
    },
    cardClosed: { paddingBottom: spacing.sm },
    header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: minTouchTarget - spacing.sm },
    title: { flex: 1, color: c.text, fontSize: t.md, fontWeight: "800" },
  }));

  // Abierta por defecto: plegarla es decision de quien la usa.
  const key = `ase3_open_${storageKey}`;
  const [open, setOpen] = useState(() => (storageKey ? getJSON(key, true) : true));

  function toggle() {
    const next = !open;
    setOpen(next);
    setJSON(key, next);
  }

  const headerContent = (
    <>
      <Icon name={icon} size={18} color={colors.text} />
      <Text accessibilityRole={storageKey ? undefined : "header"} style={styles.title}>
        {title}
      </Text>
      {trailing}
    </>
  );

  return (
    <View style={[styles.card, !open && styles.cardClosed]}>
      {storageKey ? (
        <Pressable
          accessibilityRole="button"
          aria-expanded={open}
          accessibilityLabel={title}
          onPress={toggle}
          style={({ pressed }) => [styles.header, pressed && { opacity: 0.85 }]}
        >
          {headerContent}
          <Icon name={open ? "chevronUp" : "chevronDown"} size={20} color={colors.textMuted} />
        </Pressable>
      ) : (
        <View style={styles.header}>{headerContent}</View>
      )}
      {open && children}
    </View>
  );
}

// Texto secundario para estados vacios / de carga dentro de una Card.
export function MutedText({ children }: PropsWithChildren) {
  const styles = useStyles((c, t) => ({
    muted: { color: c.textMuted, fontSize: t.sm, lineHeight: t.line(t.sm) },
  }));
  return <Text style={styles.muted}>{children}</Text>;
}
