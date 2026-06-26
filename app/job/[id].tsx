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
  const { state, withdrawMyQuote, revealJobBudget, purchaseReveal } = useAppState();
  const job = state.jobs.find((item) => item.id === id);
  const [detail, setDetail] = useState<ApiJobDetail | null>(null);
  // Reveal state — the amount + remaining balance come from the server only.
  const [revealedAmount, setRevealedAmount] = useState<number | null>(null);
  const [revealsLeft, setRevealsLeft] = useState<number | null>(null);
  const [needsPurchase, setNeedsPurchase] = useState(false);
  const [revealError, setRevealError] = useState<string | null>(null);
  const [revealBusy, setRevealBusy] = useState(false);
  const isApproved = state.verificationStatus === "approved";

  const refreshDetail = useCallback(() => {
    if (!id) return undefined;
    let active = true;
    getJobDetail(id)
      .then((result) => {
        if (active) {
          setDetail(result);
          // Adopt the server's revealed budget if this provider already holds a reveal.
          if (result.job.competitor_amount_revealed && result.job.competitor_amount != null) {
            setRevealedAmount(result.job.competitor_amount);
          }
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => refreshDetail(), [refreshDetail]);

  const handleReveal = useCallback(async () => {
    if (!id || revealBusy) return;
    setRevealBusy(true);
    setRevealError(null);
    const result = await revealJobBudget(String(id));
    if (result.ok) {
      setRevealedAmount(result.revealedAmount);
      setRevealsLeft(result.revealsRemaining);
      setNeedsPurchase(false);
      refreshDetail();
    } else if (result.needsPurchase) {
      setNeedsPurchase(true);
    } else {
      setRevealError("Could not reveal the budget. Please try again.");
    }
    setRevealBusy(false);
  }, [id, revealBusy, revealJobBudget, refreshDetail]);

  const handlePurchase = useCallback(async () => {
    if (revealBusy) return;
    setRevealBusy(true);
    setRevealError(null);
    const purchased = await purchaseReveal();
    setRevealBusy(false);
    if (!purchased.ok) {
      setRevealError("Purchase did not go through. Please try again.");
      return;
    }
    setNeedsPurchase(false);
    // Spend the just-purchased reveal on this job.
    await handleReveal();
  }, [revealBusy, purchaseReveal, handleReveal]);

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

  // Never show a budget number unless the server says this provider has revealed it.
  const serverRevealed = apiJob?.competitor_amount_revealed === true && apiJob.competitor_amount != null;
  const isRevealed = serverRevealed || revealedAmount != null;
  const displayAmount = revealedAmount ?? (serverRevealed ? apiJob?.competitor_amount ?? null : null);

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
      <Card style={styles.revealCard}>
        <AppText variant="eyebrow">Competitor budget</AppText>
        {isRevealed && displayAmount != null ? (
          <>
            <AppText variant="heading">AED {displayAmount}</AppText>
            {revealsLeft != null ? (
              <AppText color={theme.colors.mutedForeground}>{revealsLeft} reveals left</AppText>
            ) : (
              <AppText color={theme.colors.mutedForeground}>{state.revealCredits} reveals left</AppText>
            )}
          </>
        ) : (
          <>
            <AppText variant="heading">AED •••</AppText>
            <AppText color={theme.colors.mutedForeground}>
              Spend one reveal to see what this customer budgeted for the job.
            </AppText>
            {needsPurchase ? (
              <>
                <AppText color={theme.colors.destructive}>You are out of reveals.</AppText>
                <Button
                  label={revealBusy ? "Working…" : "Buy 1 reveal"}
                  tone="accent"
                  onPress={handlePurchase}
                />
              </>
            ) : (
              <Button
                label={revealBusy ? "Revealing…" : `Reveal competitor budget • ${state.revealCredits} left`}
                onPress={handleReveal}
              />
            )}
            {revealError ? <AppText color={theme.colors.destructive}>{revealError}</AppText> : null}
          </>
        )}
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
  revealCard: {
    gap: 10,
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
