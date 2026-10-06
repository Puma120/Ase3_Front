import { PropsWithChildren, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { getJSON, setJSON } from "../services/localStore";
import { useStyles, useTheme } from "../theme/useTheme";
import { minTouchTarget, radius, spacing } from "../theme/tokens";
import { Icon, IconName } from "./Icon";

interface CollapsibleProps extends PropsWithChildren {
  title: string;
  icon: IconName;
  /** Resumen corto junto al titulo, p. ej. "2 avisos nuevos". */
  summary?: string;
  /** Recuerda abierto/cerrado entre visitas. */
  storageKey: string;
}

// Seccion plegable, cerrada por defecto: deja a la vista solo lo principal
// (decision 2, maximo 5 opciones por pantalla) y guarda lo secundario o
// avanzado para quien lo busque (decision 10, version simplificada).
export function Collapsible({ title, icon, summary, storageKey, children }: CollapsibleProps) {
  const { colors } = useTheme();
  const styles = useStyles((c, t) => ({
    wrapper: { gap: spacing.md },
    header: {
      minHeight: minTouchTarget,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.primarySoft,
    },
    title: { color: c.text, fontSize: t.md, fontWeight: "800" },
    summary: { flex: 1, color: c.textMuted, fontSize: t.sm, fontWeight: "600" },
    content: { gap: spacing.md },
  }));

  const key = `ase3_open_${storageKey}`;
  const [open, setOpen] = useState(() => getJSON(key, false));

  function toggle() {
    const next = !open;
    setOpen(next);
    setJSON(key, next);
  }

  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="button"
        aria-expanded={open}
        accessibilityLabel={summary ? `${title}, ${summary}` : title}
        onPress={toggle}
        style={({ pressed }) => [styles.header, pressed && { opacity: 0.85 }]}
      >
        <Icon name={icon} size={18} color={colors.text} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.summary} numberOfLines={1}>
          {summary ?? ""}
        </Text>
        <Icon name={open ? "chevronUp" : "chevronDown"} size={20} color={colors.textMuted} />
      </Pressable>
      {open && <View style={styles.content}>{children}</View>}
    </View>
  );
}
