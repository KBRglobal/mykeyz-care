import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
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
  const { state, revealJobBudget } = useAppState();
  const job = state.jobs.find((item) => item.id === id) ?? state.jobs[0];
  // Amount and balance are server-authoritative — captured from the reveal response.
  const [revealedAmount, setRevealedAmount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const hasRevealed = revealedAmount != null;

  const onReveal = useCallback(async () => {
    if (!job || hasRevealed || busy) return;
    setBusy(true);
    const result = await revealJobBudget(job.id);
    setBusy(false);
    if (result.ok) {
      setRevealedAmount(result.revealedAmount);
    } else if (result.needsPurchase) {
      // Out of reveals — send to the placeholder purchase screen.
      router.push("/credits");
    }
  }, [job, hasRevealed, busy, revealJobBudget]);

  return (
    <Screen>
      <ArrowLeft color={theme.colors.primary} size={26} onPress={() => router.back()} />
      <View style={styles.center}>
        <View style={styles.lock}>
          <LockKeyhole color={theme.colors.accent} size={40} />
        </View>
        <AppText variant="heading" align="center">
          Reveal Competitor Budget
        </AppText>
        <AppText color={theme.colors.mutedForeground} align="center">
          Use one reveal to see what this customer budgeted for the job.
        </AppText>
      </View>
      <Card muted style={styles.priceCard}>
        <Trophy color={theme.colors.accent} fill={theme.colors.accent} size={26} />
        <View style={styles.hiddenPrice}>
          <AppText variant="eyebrow">{hasRevealed ? "Competitor budget" : "Budget hidden"}</AppText>
          <AppText variant="heading">AED {hasRevealed ? revealedAmount : "•••"}</AppText>
        </View>
      </Card>
      <Button
        label={
          hasRevealed
            ? `Budget unlocked • ${state.revealCredits} left`
            : busy
              ? "Revealing…"
              : `Reveal for 1 credit • ${state.revealCredits} left`
        }
        onPress={onReveal}
      />
      <Button label="Update my quote" tone="secondary" style={styles.secondary} onPress={() => router.back()} />
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
