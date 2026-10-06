import { PropsWithChildren, ReactNode } from "react";
import { Text, View } from "react-native";

import { useStyles, useTheme } from "../theme/useTheme";
import { minTouchTarget, radius, spacing } from "../theme/tokens";
import { Icon, IconName } from "./Icon";

interface CardProps extends PropsWithChildren {
  title: string;
  icon: IconName;
  trailing?: ReactNode;
}

// Contenedor de seccion unico (Home y Ajustes): icono + titulo arriba, el
// contenido debajo. Una sola forma de agrupar informacion en toda la app.
export function Card({ title, icon, trailing, children }: CardProps) {
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
    header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: minTouchTarget - spacing.sm },
    title: { flex: 1, color: c.text, fontSize: t.md, fontWeight: "800" },
  }));
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Icon name={icon} size={18} color={colors.text} />
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {trailing}
      </View>
      {children}
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
