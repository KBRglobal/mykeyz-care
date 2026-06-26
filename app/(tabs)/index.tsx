import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { BriefcaseBusiness, CalendarClock, CircleDollarSign } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { OpportunityCard } from "@/src/components/product/OpportunityCard";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Header } from "@/src/components/ui/Header";
import { Screen } from "@/src/components/ui/Screen";
import { useAppState } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { state } = useAppState();
  const selectedTrades = state.selectedTradeKeys.map((key) => key.toLowerCase());
  const newJobs = state.jobs.filter((job) => {
    const tradeMatch = selectedTrades.some((trade) => job.trade.toLowerCase().includes(trade) || trade.includes(job.trade.toLowerCase()));
    const areaMatch = state.selectedAreas.includes(job.area);
    return job.status === "new" && (tradeMatch || areaMatch);
  });
  const activeCount = state.activeJobs.filter((job) => !job.completed).length;
  const availabilityCount = Object.values(state.availability).reduce((sum, slots) => sum + slots.length, 0);

  if (state.simpleMode) {
    return (
      <Screen>
        <Header title={t("hello")} onAction={() => router.push("/settings")} />
        <View style={styles.simpleHero}>
          <AppText variant="eyebrow">Simple Mode</AppText>
          <AppText variant="heading">Today</AppText>
          <AppText color={theme.colors.mutedForeground}>
            Big actions only. New jobs, money, active work.
          </AppText>
        </View>
        <View style={styles.simpleGrid}>
          <Card style={styles.simpleTile}>
            <BriefcaseBusiness color={theme.colors.primary} size={32} />
            <AppText variant="heading">{newJobs.length}</AppText>
            <AppText variant="label">New jobs</AppText>
            <Button label="Open" onPress={() => router.push("/(tabs)/quotes")} />
          </Card>
          <Card style={styles.simpleTile}>
            <CircleDollarSign color={theme.colors.accent} size={32} />
            <AppText variant="heading">{Math.round(state.totalEarned)}</AppText>
            <AppText variant="label">AED earned</AppText>
            <Button label="Earnings" tone="secondary" onPress={() => router.push("/earnings")} />
          </Card>
          <Card style={styles.simpleTileWide}>
            <CalendarClock color={theme.colors.info} size={32} />
            <View style={styles.simpleWideCopy}>
              <AppText variant="title">{activeCount} active jobs</AppText>
              <AppText color={theme.colors.mutedForeground}>{availabilityCount} available slots marked this week</AppText>
            </View>
            <Button label="Set availability" tone="accent" onPress={() => router.push("/availability")} />
          </Card>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title={t("hello")} onAction={() => router.push("/notifications")} />
      <View style={styles.stats}>
        <View>
          <AppText variant="eyebrow">{t("newLeads")}</AppText>
          <AppText variant="heading">{newJobs.length}</AppText>
        </View>
        <View>
          <AppText variant="eyebrow">{t("earned")} (AED)</AppText>
          <AppText variant="heading" color={theme.colors.accent}>
            {(state.totalEarned / 1000).toFixed(1)}K
          </AppText>
        </View>
      </View>
      <View style={styles.quickRow}>
        <AppText variant="eyebrow" color={theme.colors.info} onPress={() => router.push("/earnings")}>
          View earnings
        </AppText>
        <AppText variant="eyebrow" color={theme.colors.primary} onPress={() => router.push("/availability")}>
          Set availability
        </AppText>
        <AppText variant="eyebrow" color={theme.colors.accent} onPress={() => router.push("/plans")}>
          Upgrade visibility
        </AppText>
      </View>
      <View style={styles.sectionHeader}>
        <AppText variant="eyebrow">{t("nearYou")}</AppText>
        <AppText variant="eyebrow" color={theme.colors.accent}>
          {t("verifiedJobs")}
        </AppText>
      </View>
      <View style={styles.list}>
        {newJobs.slice(0, 2).map((job) => (
          <OpportunityCard key={job.id} job={job} onPress={() => router.push(`/job/${job.id}`)} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  list: {
    gap: 16,
  },
  simpleHero: {
    gap: 8,
    marginBottom: 18,
  },
  simpleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  simpleTile: {
    gap: 12,
    minHeight: 214,
    width: "48%",
  },
  simpleTileWide: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    width: "100%",
  },
  simpleWideCopy: {
    flex: 1,
    gap: 4,
    minWidth: 180,
  },
});
