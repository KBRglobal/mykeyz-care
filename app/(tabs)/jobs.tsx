import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { JobCard } from "@/src/components/product/JobCard";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { Header } from "@/src/components/ui/Header";
import { Screen } from "@/src/components/ui/Screen";
import { useAppState } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

export default function JobsScreen() {
  const { t } = useTranslation();
  const { state } = useAppState();
  const activeJobs = state.activeJobs.filter((job) => !job.completed);

  return (
    <Screen>
      <Header title={t("jobs")} />
      <View style={styles.segment}>
        <AppText style={styles.active}>Active</AppText>
        <AppText style={styles.segmentText}>Completed</AppText>
        <AppText style={styles.segmentText}>All</AppText>
      </View>
      <Button label="Optimize route" tone="accent" style={styles.routeButton} onPress={() => router.push("/route-plan")} />
      <View style={styles.list}>
        {activeJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: {
    backgroundColor: theme.colors.mutedStrong,
    borderRadius: theme.radius.md,
    flexDirection: "row",
    gap: 6,
    marginBottom: 18,
    padding: 6,
  },
  active: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    color: theme.colors.primary,
    flex: 1,
    fontFamily: theme.fonts.sansBold,
    fontSize: 12,
    overflow: "hidden",
    paddingVertical: 12,
    textAlign: "center",
    textTransform: "uppercase",
  },
  segmentText: {
    color: theme.colors.mutedForeground,
    flex: 1,
    fontFamily: theme.fonts.sansBold,
    fontSize: 12,
    paddingVertical: 12,
    textAlign: "center",
    textTransform: "uppercase",
  },
  list: {
    gap: 16,
  },
  routeButton: {
    marginBottom: 16,
  },
});
