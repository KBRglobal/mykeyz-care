import { Pressable, StyleSheet, View } from "react-native";
import { Bell, Languages, Search } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { AppText } from "@/src/components/ui/AppText";
import { BrandMark } from "@/src/components/ui/BrandMark";
import { theme } from "@/src/theme/tokens";

type HeaderProps = {
  title?: string;
  subtitle?: string;
  action?: "bell" | "search" | "language";
  onAction?: () => void;
};

export function Header({ title, subtitle, action = "bell", onAction }: HeaderProps) {
  const { t } = useTranslation();
  const Icon = action === "search" ? Search : action === "language" ? Languages : Bell;

  return (
    <View style={styles.wrap}>
      <View style={styles.copy}>
        <BrandMark />
        {subtitle ? <AppText variant="eyebrow">{subtitle}</AppText> : null}
        {title ? <AppText variant="heading">{title}</AppText> : null}
      </View>
      <Pressable onPress={onAction} style={styles.action}>
        <Icon color={theme.colors.primary} size={22} strokeWidth={2.8} />
        {action === "language" ? <AppText style={styles.language}>{t("language")}</AppText> : null}
        {action === "bell" ? <View style={styles.badge} /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  copy: {
    flex: 1,
    gap: 7,
  },
  action: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    flexDirection: "row",
    gap: 7,
    minHeight: 48,
    minWidth: 48,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  badge: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.surface,
    borderRadius: 999,
    borderWidth: 2,
    height: 10,
    position: "absolute",
    right: 12,
    top: 12,
    width: 10,
  },
  language: {
    color: theme.colors.mutedForeground,
    fontFamily: theme.fonts.sansBold,
    fontSize: 10,
    textTransform: "uppercase",
  },
});
