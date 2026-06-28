import { StyleSheet, View } from "react-native";
import { Award, Eye, MessageSquareText, Target, TrendingUp } from "lucide-react-native";
import { AppText } from "@/src/components/ui/AppText";
import { BackHeader } from "@/src/components/ui/BackHeader";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { useAppState } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

export default function PerformanceScreen() {
  const { state } = useAppState();
  const active = state.activeJobs.filter((job) => !job.completed).length;
  // Server-authoritative reveal usage; fall back to this session's list before the wallet loads.
  const viewed = state.wallet ? state.wallet.debited_total : state.revealedJobIds.length;
  const winRate = state.quotesSent ? Math.round((state.completedJobs / state.quotesSent) * 100) : 0;
  const availabilityCount = Object.values(state.availability).reduce((sum, slots) => sum + slots.length, 0);
  // A real, state-driven recommendation — never a hardcoded tip.
  const nextAction = state.verificationStatus !== "approved"
    ? "Complete verification — you can send quotes once you're approved."
    : availabilityCount === 0
      ? "Add your availability so customers can pick a time that works."
      : state.quotesSent === 0
        ? "Send your first quote on a matched job to start winning work."
        : "Keep your availability current and reply quickly to win more jobs.";
  const metrics = [
    { label: "Quotes sent", value: state.quotesSent, icon: MessageSquareText, tone: theme.colors.info },
    { label: "Jobs active", value: active, icon: Target, tone: theme.colors.primary },
    { label: "Reveals used", value: viewed, icon: Eye, tone: theme.colors.accent },
    { label: "Win rate", value: `${winRate}%`, icon: Award, tone: theme.colors.success },
  ];

  return (
    <Screen>
      <BackHeader />
      <View style={styles.header}>
        <AppText variant="heading">Weekly report</AppText>
        <AppText color={theme.colors.mutedForeground}>
          See what brings work in. More quotes, faster replies, and clear availability improve your rank.
        </AppText>
      </View>
      <Card style={styles.rank}>
        <View style={styles.rankIcon}>
          <TrendingUp color={theme.colors.primaryForeground} size={30} />
        </View>
        <View style={styles.rankCopy}>
          <AppText variant="eyebrow">Jobs completed</AppText>
          <AppText variant="title">{state.completedJobs}</AppText>
          <AppText color={theme.colors.mutedForeground}>
            {state.completedJobs === 0
              ? "Win and complete your first job to start building your record."
              : `AED ${Math.round(state.totalEarned).toLocaleString()} earned via MyKeyz so far.`}
          </AppText>
        </View>
      </Card>
      <View style={styles.grid}>
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} muted style={styles.metric}>
              <Icon color={metric.tone} size={24} />
              <AppText variant="heading" style={styles.metricValue}>
                {metric.value}
              </AppText>
              <AppText variant="eyebrow">{metric.label}</AppText>
            </Card>
          );
        })}
      </View>
      <Card muted style={styles.next}>
        <AppText variant="label">Next best action</AppText>
        <AppText color={theme.colors.mutedForeground}>
          {nextAction}
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
    marginBottom: 18,
  },
  rank: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  rankIcon: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: 24,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  rankCopy: {
    flex: 1,
    gap: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  metric: {
    gap: 8,
    minHeight: 132,
    width: "48%",
  },
  metricValue: {
    fontSize: 30,
    lineHeight: 32,
  },
  next: {
    gap: 8,
  },
});
