import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ArrowLeft, MapPin } from "lucide-react-native";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { useAppState } from "@/src/state/AppState";
import { getJobDetail, type ApiJobDetail } from "@/src/services/api";
import { theme } from "@/src/theme/tokens";

const severityColor: Record<"low" | "medium" | "high", string> = {
  low: theme.colors.info,
  medium: theme.colors.warning,
  high: theme.colors.destructive,
};

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useAppState();
  const job = state.jobs.find((item) => item.id === id);
  const [detail, setDetail] = useState<ApiJobDetail | null>(null);
  const isApproved = state.verificationStatus === "approved";

  useEffect(() => {
    if (!id) return;
    let active = true;
    getJobDetail(id)
      .then((result) => {
        if (active) setDetail(result);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [id]);

  const apiJob = detail?.job;
  const trade =
    job?.trade ?? apiJob?.trade_category.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) ?? "Job";
  const title = job?.title ?? apiJob?.service_type ?? "Matched job";
  const area = job?.area ?? apiJob?.location_area ?? "";
  const home = job?.home ?? apiJob?.location_address ?? "";
  const distance = job?.distance ?? "";
  const Icon = job?.icon ?? MapPin;
  const estimateLow = apiJob ? apiJob.estimated_value_min : (job?.estimate ?? 0) - 120;
  const estimateHigh = apiJob ? apiJob.estimated_value_max : (job?.estimate ?? 0) + 120;
  const findings = detail?.findings ?? [];
  // Default to gating the CTA until the detail call confirms can_quote.
  const canQuote = detail ? detail.can_quote : false;

  return (
    <Screen>
      <ArrowLeft color={theme.colors.primary} size={26} onPress={() => router.back()} />
      <View style={styles.header}>
        <AppText variant="eyebrow">{trade}</AppText>
        <AppText variant="heading">{title}</AppText>
        <View style={styles.meta}>
          <MapPin color={theme.colors.accent} size={16} fill={theme.colors.accent} />
          <AppText variant="label">
            {[area, home, distance].filter(Boolean).join(" • ")}
          </AppText>
        </View>
      </View>
      <Card style={styles.findingsCard}>
        <View style={styles.findingsHead}>
          <View style={styles.icon}>
            <Icon color={theme.colors.accent} size={30} />
          </View>
          <AppText variant="eyebrow">Inspection findings</AppText>
        </View>
        {findings.length === 0 ? (
          <AppText color={theme.colors.mutedForeground}>{job?.issue ?? apiJob?.description ?? "No findings recorded."}</AppText>
        ) : (
          <View style={styles.findingsList}>
            {findings.map((finding) => (
              <View key={finding.id} style={styles.findingRow}>
                <View style={styles.findingCopy}>
                  <AppText variant="label">{finding.room}</AppText>
                  <AppText color={theme.colors.mutedForeground}>{finding.description}</AppText>
                </View>
                <AppText variant="eyebrow" color={severityColor[finding.severity]}>
                  {finding.severity}
                </AppText>
              </View>
            ))}
          </View>
        )}
      </Card>
      <Card muted style={styles.estimate}>
        <AppText variant="eyebrow">Typical range</AppText>
        <AppText variant="heading">AED {estimateLow}-{estimateHigh}</AppText>
        <AppText color={theme.colors.mutedForeground}>
          Based on recent provider quotes for similar verified homes.
        </AppText>
      </Card>
      {canQuote ? (
        <Button label="Send Quote" onPress={() => router.push(`/quote/${id}`)} />
      ) : isApproved ? (
        <Button label="Quoting closed" tone="secondary" />
      ) : (
        <Button label="Get verified to send quotes" tone="secondary" onPress={() => router.push("/(tabs)")} />
      )}
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
  findingsCard: {
    gap: 16,
    marginBottom: 16,
  },
  findingsHead: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
  },
  icon: {
    alignItems: "center",
    backgroundColor: theme.colors.muted,
    borderRadius: 20,
    height: 62,
    justifyContent: "center",
    width: 62,
  },
  findingsList: {
    gap: 14,
  },
  findingRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  findingCopy: {
    flex: 1,
    gap: 4,
  },
  estimate: {
    gap: 8,
    marginBottom: 20,
  },
});
