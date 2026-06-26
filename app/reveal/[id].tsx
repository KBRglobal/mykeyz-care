import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { ArrowLeft, LockKeyhole, Trophy } from "lucide-react-native";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { theme } from "@/src/theme/tokens";
import { useAppState } from "@/src/state/AppState";

export default function RevealScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, revealPrice } = useAppState();
  const job = state.jobs.find((item) => item.id === id) ?? state.jobs[0];
  const hasRevealed = state.revealedJobIds.includes(job.id);

  return (
    <Screen>
      <ArrowLeft color={theme.colors.primary} size={26} onPress={() => router.back()} />
      <View style={styles.center}>
        <View style={styles.lock}>
          <LockKeyhole color={theme.colors.accent} size={40} />
        </View>
        <AppText variant="heading" align="center">
          Reveal Winning Price
        </AppText>
        <AppText color={theme.colors.mutedForeground} align="center">
          Use one reveal credit to see the offer currently above yours.
        </AppText>
      </View>
      <Card muted style={styles.priceCard}>
        <Trophy color={theme.colors.accent} fill={theme.colors.accent} size={26} />
        <View style={styles.hiddenPrice}>
          <AppText variant="eyebrow">{hasRevealed ? "Competitor #1 bid" : "Price hidden"}</AppText>
          <AppText variant="heading">AED {hasRevealed ? job.competitorPrice : "•••"}</AppText>
        </View>
      </Card>
      <Button
        label={hasRevealed ? "Price already unlocked" : `Reveal for 1 credit • ${state.revealCredits} left`}
        onPress={() => {
          if (hasRevealed) return;
          const ok = revealPrice(job.id);
          if (!ok) router.push("/credits");
        }}
      />
      <Button label="Update my quote" tone="secondary" style={styles.secondary} onPress={() => router.back()} />
      <Button label="No credits state" tone="secondary" style={styles.secondary} onPress={() => router.push("/credits")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    gap: 14,
    marginBottom: 24,
    marginTop: 54,
  },
  lock: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    height: 82,
    justifyContent: "center",
    width: 82,
    ...theme.shadows.card,
  },
  priceCard: {
    alignItems: "center",
    gap: 10,
    marginBottom: 22,
  },
  hiddenPrice: {
    alignItems: "center",
  },
  secondary: {
    marginTop: 12,
  },
});
