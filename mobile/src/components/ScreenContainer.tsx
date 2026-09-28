import { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { colors, spacing } from "../theme/tokens";

interface ScreenContainerProps extends PropsWithChildren {
  center?: boolean;
}

// Shared layout wrapper reused by every screen, on both native and web
// (react-native-web) targets.
function ScreenContainerBase({ children, center = false }: ScreenContainerProps) {
  return (
    <View style={[styles.container, center && styles.centered]}>{children}</View>
  );
}

function Spacer({ size = "md" }: { size?: keyof typeof spacing }) {
  return <View style={{ height: spacing[size] }} />;
}

export const ScreenContainer = Object.assign(ScreenContainerBase, { Spacer });

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  centered: {
    justifyContent: "center",
  },
});
