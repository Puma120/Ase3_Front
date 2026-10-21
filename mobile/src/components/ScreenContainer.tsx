import { PropsWithChildren } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useStyles } from "../theme/useTheme";
import { spacing } from "../theme/tokens";

interface ScreenContainerProps extends PropsWithChildren {
  center?: boolean;
}

// Shared layout wrapper reused by every screen, on both native and web
// (react-native-web) targets. El contenido se centra con ancho
// maximo para que la PWA en escritorio no estire el formulario.
function ScreenContainerBase({ children, center = false }: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const styles = useStyles((c) => ({
    container: { flex: 1, backgroundColor: c.background, alignItems: "center" },
    inner: { flex: 1, width: "100%", maxWidth: 440, padding: spacing.md, paddingTop: spacing.md + insets.top, paddingBottom: spacing.md + insets.bottom },
    centered: { justifyContent: "center" },
  }));
  return (
    <View style={styles.container}>
      <View style={[styles.inner, center && styles.centered]}>{children}</View>
    </View>
  );
}

function Spacer({ size = "md" }: { size?: keyof typeof spacing }) {
  return <View style={{ height: spacing[size] }} />;
}

export const ScreenContainer = Object.assign(ScreenContainerBase, { Spacer });
