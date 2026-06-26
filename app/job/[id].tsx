import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { ArrowLeft, MapPin } from "lucide-react-native";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { useAppState } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useAppState();
  const job = state.jobs.find((item) => item.id === id) ?? state.jobs[0];
  const Icon = job.icon;

  return (
    <Screen>
      <ArrowLeft color={theme.colors.primary} size={26} onPress={() => router.back()} />
      <View style={styles.header}>
        <AppText variant="eyebrow">{job.trade}</AppText>
        <AppText variant="heading">{job.title}</AppText>
        <View style={styles.meta}>
          <MapPin color={theme.colors.accent} size={16} fill={theme.colors.accent} />
          <AppText variant="label">
            {job.area} • {job.home} • {job.distance}
          </AppText>
        </View>
      </View>
      <Card style={styles.issue}>
        <View style={styles.icon}>
          <Icon color={theme.colors.accent} size={30} />
        </View>
        <View style={styles.issueCopy}>
          <AppText variant="eyebrow">Inspection finding</AppText>
          <AppText>{job.issue}</AppText>
        </View>
      </Card>
      <Card muted style={styles.estimate}>
        <AppText variant="eyebrow">Typical range</AppText>
        <AppText variant="heading">AED {job.estimate - 120}-{job.estimate + 120}</AppText>
        <AppText color={theme.colors.mutedForeground}>
          Based on recent provider quotes for similar verified homes.
        </AppText>
      </Card>
      <Button label="Send Quote" onPress={() => router.push(`/quote/${job.id}`)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
    marginBottom: 22,
    marginTop: 24,
  },
  meta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  issue: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  icon: {
    alignItems: "center",
    backgroundColor: theme.colors.muted,
    borderRadius: 20,
    height: 62,
    justifyContent: "center",
    width: 62,
  },
  issueCopy: {
    flex: 1,
    gap: 6,
  },
  estimate: {
    gap: 8,
    marginBottom: 20,
  },
});
