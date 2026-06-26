import { Text, type TextProps, StyleSheet } from "react-native";
import { theme } from "@/src/theme/tokens";

type Variant = "body" | "label" | "eyebrow" | "heading" | "title" | "mono";

type AppTextProps = TextProps & {
  variant?: Variant;
  color?: string;
  align?: "left" | "center" | "right";
};

export function AppText({ variant = "body", color, align, style, ...props }: AppTextProps) {
  return (
    <Text
      {...props}
      style={[
        styles.base,
        styles[variant],
        color ? { color } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: theme.colors.foreground,
    fontFamily: theme.fonts.sans,
    letterSpacing: 0,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
  },
  label: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 12,
    lineHeight: 16,
  },
  eyebrow: {
    color: theme.colors.mutedForeground,
    fontFamily: theme.fonts.sansBold,
    fontSize: 10,
    lineHeight: 13,
    textTransform: "uppercase",
  },
  heading: {
    fontFamily: theme.fonts.heading,
    fontSize: 36,
    lineHeight: 38,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: theme.fonts.heading,
    fontSize: 24,
    lineHeight: 28,
    textTransform: "uppercase",
  },
  mono: {
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    lineHeight: 16,
    textTransform: "uppercase",
  },
});
