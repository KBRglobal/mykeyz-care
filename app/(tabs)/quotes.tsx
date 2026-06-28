import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { OpportunityCard } from "@/src/components/product/OpportunityCard";
import { AppText } from "@/src/components/ui/AppText";
import { Card } from "@/src/components/ui/Card";
import { Header } from "@/src/components/ui/Header";
import { Screen } from "@/src/components/ui/Screen";
import { useAppState } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

export default function QuotesScreen() {
  const { t } = useTranslation();
  const { state } = useAppState();
  const openJobs = state.jobs.filter((job) => job.status === "new");
  const sentJobs = state.jobs.filter((job) => job.status === "quoted");

  return (
    <Screen>
      <Header title={t("opportunity")} action="search" />
      <View style={styles.list}>
        {openJobs.length === 0 && sentJobs.length === 0 ? (
          <Card muted style={styles.empty}>
            <AppText variant="title">No open opportunities</AppText>
            <AppText color={theme.colors.mutedForeground}>
              New jobs that match your trades and areas will appear here.
            </AppText>
          </Card>
        ) : null}
        {openJobs.map((job) => (
          <OpportunityCard key={job.id} job={job} onPress={() => router.push(`/job/${job.id}`)} />
        ))}
        {sentJobs.length ? (
          <View style={styles.sentBlock}>
            <AppText variant="eyebrow">Quotes already sent</AppText>
            {sentJobs.map((job) => (
              <OpportunityCard key={job.id} job={job} onPress={() => router.push(`/reveal/${job.id}`)} />
            ))}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 16,
  },
  empty: {
    gap: 6,
  },
  sentBlock: {
    gap: 12,
    marginTop: 8,
  },
});
