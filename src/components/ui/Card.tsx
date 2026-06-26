import { View, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { theme } from "@/src/theme/tokens";

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  muted?: boolean;
};

export function Card({ children, style, muted }: CardProps) {
  return <View style={[styles.card, muted ? styles.muted : null, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: theme.radius.xl,
    padding: 22,
    width: "100%",
    ...theme.shadows.card,
  },
  muted: {
    backgroundColor: theme.colors.muted,
    borderColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },
});
