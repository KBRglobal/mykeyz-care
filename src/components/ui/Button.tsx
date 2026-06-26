import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { AppText } from "@/src/components/ui/AppText";
import { theme } from "@/src/theme/tokens";

type ButtonProps = {
  label: string;
  onPress?: () => void;
  tone?: "primary" | "secondary" | "accent";
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, tone = "primary", style }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[tone],
        pressed ? styles.pressed : null,
        style,
      ]}
    >
      <AppText
        variant="label"
        style={[
          styles.text,
          tone === "accent" ? styles.accentText : null,
          tone === "secondary" ? styles.secondaryText : null,
        ]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: theme.radius.md,
    height: 64,
    justifyContent: "center",
    paddingHorizontal: 22,
    width: "100%",
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.muted,
  },
  accent: {
    backgroundColor: theme.colors.accent,
  },
  text: {
    color: theme.colors.primaryForeground,
    fontSize: 14,
    textTransform: "uppercase",
  },
  accentText: {
    color: theme.colors.accentForeground,
  },
  secondaryText: {
    color: theme.colors.primary,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});
