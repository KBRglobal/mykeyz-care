import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ArrowLeft, MapPin } from "lucide-react-native";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { useAppState } from "@/src/state/AppState";
import { getJobDetail, type ApiJobDetail, type QuoteStatusApi } from "@/src/services/api";
import { theme } from "@/src/theme/tokens";

const severityColor: Record<"low" | "medium" | "high", string> = {
  low: theme.colors.info,
  medium: theme.colors.warning,
  high: theme.colors.destructive,
};

const quoteBadge: Record<QuoteStatusApi, { label: string; color: string }> = {
  pending: { label: "Quote sent", color: theme.colors.info },
  shortlisted: { label: "Shortlisted", color: theme.colors.info },
  won: { label: "You won this job", color: theme.colors.success },
  lost: { label: "Not selected", color: theme.colors.mutedForeground },
  withdrawn: { label: "Withdrawn", color: theme.colors.mutedForeground },
};

const quoteErrorCopy: Record<string, string> = {
  edit_window_closed: "This quote can no longer be changed.",
  not_withdrawable: "This quote can no longer be withdrawn.",
  request_failed: "Something went wrong. Please try again.",
};

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, withdrawMyQuote } = useAppState();
  const job = state.jobs.find((item) => item.id === id);
  const [detail, setDetail] = useState<ApiJobDetail | null>(null);
  const isApproved = state.verificationStatus === "approved";

  const refreshDetail = useCallback(() => {
    if (!id) return undefined;
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

  useEffect(() => refreshDetail(), [refreshDetail]);

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

  const myQuote = detail?.my_quote ?? null;
  const badge = myQuote ? quoteBadge[myQuote.status] : null;
  const jobIsOpen = apiJob?.status === "open";
  // The supplier may withdraw/edit ONLY their own pending quote while the job is still open.
  const canManageQuote = Boolean(myQuote && myQuote.status === "pending" && jobIsOpen);
  const errorMessage =
    state.quoteError && (state.quoteError === "edit_window_closed" || state.quoteError === "not_withdrawable")
      ? quoteErrorCopy[state.quoteError]
      : null;

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
      {myQuote ? (
        <Card style={styles.quoteCard}>
          <View style={styles.quoteHead}>
            <AppText variant="eyebrow">Your quote</AppText>
            {badge ? (
              <AppText variant="label" color={badge.color}>
                {badge.label}
              </AppText>
            ) : null}
          </View>
          <AppText variant="heading">AED {myQuote.amount}</AppText>
          {errorMessage ? (
            <AppText color={theme.colors.destructive}>{errorMessage}</AppText>
          ) : null}
          {canManageQuote ? (
            <View style={styles.quoteActions}>
              <Button
                label="Edit quote"
                tone="secondary"
                style={styles.quoteButton}
                onPress={() => router.push(`/quote/${id}?quoteId=${myQuote.id}`)}
              />
              <Button
                label="Withdraw quote"
                tone="accent"
                style={styles.quoteButton}
                onPress={() => withdrawMyQuote(String(id), myQuote.id).then(refreshDetail)}
              />
            </View>
          ) : null}
        </Card>
      ) : canQuote ? (
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
  quoteCard: {
    gap: 10,
  },
  quoteHead: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  quoteActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  quoteButton: {
    flex: 1,
  },
});
