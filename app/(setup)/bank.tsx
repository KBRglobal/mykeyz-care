import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { BadgeCheck, Briefcase, MapPin } from "lucide-react-native";
import { SetupProgress } from "@/src/components/product/SetupProgress";
import { AppText } from "@/src/components/ui/AppText";
import { BackHeader } from "@/src/components/ui/BackHeader";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { theme } from "@/src/theme/tokens";
import { useAppState } from "@/src/state/AppState";

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Not submitted yet",
  submitted: "Submitted for review",
  needs_changes: "Changes requested",
  approved: "Verified",
  rejected: "Rejected",
  suspended: "Suspended",
};

export default function ReviewScreen() {
  const { state, completeOnboarding } = useAppState();
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState("");

  const trades = state.selectedTradeKeys.map(titleCase).join(", ") || "—";
  const areas = state.selectedAreas.join(", ") || "—";

  const finish = async () => {
    if (finishing) return;
    setError("");
    setFinishing(true);
    try {
      await completeOnboarding();
      router.replace("/(tabs)");
    } catch {
      setError("Could not finish setup. Please check your connection and try again.");
    } finally {
      setFinishing(false);
    }
  };

  return (
    <Screen>
      <BackHeader />
      <SetupProgress active={4} />
      <View style={styles.header}>
        <AppText variant="heading">Review &amp; finish</AppText>
        <AppText color={theme.colors.mutedForeground}>
          Confirm your details. You get paid directly by the customer — we never ask for your bank account.
        </AppText>
      </View>
      <Card style={styles.card}>
        <View style={styles.row}>
          <Briefcase color={theme.colors.accent} size={22} />
          <View style={styles.rowText}>
            <AppText variant="eyebrow">Business</AppText>
            <AppText variant="label">{state.businessName || "—"}</AppText>
          </View>
        </View>
        <View style={styles.row}>
          <Briefcase color={theme.colors.mutedForeground} size={22} />
          <View style={styles.rowText}>
            <AppText variant="eyebrow">Trades</AppText>
            <AppText variant="label">{trades}</AppText>
          </View>
        </View>
        <View style={styles.row}>
          <MapPin color={theme.colors.mutedForeground} size={22} />
          <View style={styles.rowText}>
            <AppText variant="eyebrow">Service areas</AppText>
            <AppText variant="label">{areas}</AppText>
          </View>
        </View>
        <View style={styles.row}>
          <BadgeCheck color={theme.colors.success} size={22} />
          <View style={styles.rowText}>
            <AppText variant="eyebrow">Verification</AppText>
            <AppText variant="label">{STATUS_LABEL[state.verificationStatus] ?? state.verificationStatus}</AppText>
          </View>
        </View>
      </Card>
      {error ? <AppText color={theme.colors.destructive}>{error}</AppText> : null}
      <Button label={finishing ? "Finishing..." : "Start getting jobs"} onPress={finish} style={styles.cta} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
    marginBottom: 20,
  },
  card: {
    gap: 18,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  cta: {
    marginTop: 28,
  },
});
