import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { OpportunityCard } from "@/src/components/product/OpportunityCard";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
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
      <Card style={styles.tender}>
        <AppText variant="eyebrow" color={theme.colors.accent}>
          Tender project
        </AppText>
        <AppText variant="title" color={theme.colors.primaryForeground}>
          Full Villa Renovation
        </AppText>
        <Button label={t("submitBid")} tone="accent" onPress={() => router.push("/quote/tender-villa")} />
      </Card>
      <View style={styles.list}>
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
  tender: {
    backgroundColor: theme.colors.primary,
    borderColor: "transparent",
    gap: 22,
    marginBottom: 18,
  },
  list: {
    gap: 16,
  },
  sentBlock: {
    gap: 12,
    marginTop: 8,
  },
});
