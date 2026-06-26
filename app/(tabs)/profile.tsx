import { StyleSheet, View } from "react-native";
import { Crown, Star } from "lucide-react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Header } from "@/src/components/ui/Header";
import { Screen } from "@/src/components/ui/Screen";
import { useAppState } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { state } = useAppState();
  const { provider } = state;

  return (
    <Screen>
      <Header title={t("profileTitle")} action="language" onAction={() => router.push("/settings")} />
      <Card style={styles.hero}>
        <View style={styles.avatar}>
          <AppText variant="heading" color={theme.colors.primaryForeground}>
            AR
          </AppText>
        </View>
        <AppText variant="title" align="center">
          {provider.name}
        </AppText>
        <View style={styles.rating}>
          <Star color={theme.colors.accent} fill={theme.colors.accent} size={18} />
          <AppText variant="label">{provider.rating} Verified Expert</AppText>
        </View>
      </Card>
      <View style={styles.stats}>
        <Card muted style={styles.stat}>
          <AppText variant="heading">{provider.jobsWon}</AppText>
          <AppText variant="eyebrow">Jobs won</AppText>
        </Card>
        <Card muted style={styles.stat}>
          <AppText variant="heading">{provider.winRate}</AppText>
          <AppText variant="eyebrow">Win rate</AppText>
        </Card>
      </View>
      <Card style={styles.plan}>
        <Crown color={theme.colors.accent} fill={theme.colors.accent} size={28} />
        <View style={styles.planCopy}>
          <AppText variant="title">Premium Highlight</AppText>
          <AppText color={theme.colors.mutedForeground}>
          {state.revealCredits} reveals remaining in your wallet.
          </AppText>
        </View>
      </Card>
      <Button label="Upgrade Visibility" onPress={() => router.push("/plans")} />
      <Button label="View earnings" tone="secondary" onPress={() => router.push("/earnings")} style={styles.secondary} />
      <Button label="Preview public profile" tone="secondary" onPress={() => router.push("/profile-preview")} style={styles.secondary} />
      <Button label="Edit profile" tone="secondary" onPress={() => router.push("/edit-profile")} style={styles.secondary} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: 32,
    height: 92,
    justifyContent: "center",
    width: 92,
  },
  rating: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },
  stats: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 16,
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  plan: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    marginBottom: 18,
  },
  planCopy: {
    flex: 1,
  },
  secondary: {
    marginTop: 12,
  },
});
