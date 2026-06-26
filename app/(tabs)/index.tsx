import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { BriefcaseBusiness, CalendarClock, CircleDollarSign } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { OpportunityCard } from "@/src/components/product/OpportunityCard";
import { VerificationBanner } from "@/src/components/product/VerificationBanner";
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
  // The API already returns only jobs matched to this supplier's trades & areas,
  // so the feed renders straight from state.jobs — no local filtering needed.
  const newJobs = state.jobs.filter((job) => job.status === "new");
  const isApproved = state.verificationStatus === "approved";
  const activeCount = state.activeJobs.filter((job) => !job.completed).length;
  const availabilityCount = Object.values(state.availability).reduce((sum, slots) => sum + slots.length, 0);

  if (state.simpleMode) {
    return (
      <Screen>
        <Header title={t("hello")} onAction={() => router.push("/settings")} />
        <VerificationBanner />
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
      <VerificationBanner />
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
      {!isApproved ? (
        <AppText variant="label" color={theme.colors.mutedForeground} style={styles.verifyNote}>
          Get verified before you can send quotes on these jobs.
        </AppText>
      ) : null}
      <View style={styles.sectionHeader}>
        <AppText variant="eyebrow">{t("nearYou")}</AppText>
        <AppText variant="eyebrow" color={theme.colors.accent}>
          {t("verifiedJobs")}
        </AppText>
      </View>
      <View style={styles.list}>
        {newJobs.length === 0 ? (
          <Card muted style={styles.empty}>
            <AppText variant="title">No matched jobs yet</AppText>
            <AppText color={theme.colors.mutedForeground}>
              We'll notify you when a job fits your trades & areas.
            </AppText>
          </Card>
        ) : (
          newJobs.slice(0, 2).map((job) => (
            <OpportunityCard key={job.id} job={job} onPress={() => router.push(`/job/${job.id}`)} />
          ))
        )}
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
  verifyNote: {
    marginBottom: 16,
  },
  empty: {
    gap: 6,
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
