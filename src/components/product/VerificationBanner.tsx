import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { AlertTriangle, Clock, ShieldCheck } from "lucide-react-native";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { useAppState } from "@/src/state/AppState";
import { getVerification, type VerificationStatus } from "@/src/services/api";
import { theme } from "@/src/theme/tokens";

export function VerificationBanner() {
  const { state, submitVerification } = useAppState();
  const [status, setStatus] = useState<VerificationStatus>(state.verificationStatus);
  const [reason, setReason] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refresh status + reason on every screen focus so an admin decision shows
  // up without a full app restart.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setStatus(state.verificationStatus);
      getVerification()
        .then((result) => {
          if (!active) return;
          setStatus(result.verification_status);
          setReason(result.reason);
        })
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, [state.verificationStatus]),
  );

  const onResubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const supplier = await submitVerification();
      setStatus(supplier.verification_status);
      setReason(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setErrorMessage(message === "incomplete_profile" ? "Complete your profile first" : "Couldn't submit — please try again");
    } finally {
      setSubmitting(false);
    }
  }, [submitting, submitVerification]);

  if (status === "approved") {
    return (
      <View style={[styles.row, styles.successRow]}>
        <ShieldCheck color={theme.colors.success} size={18} strokeWidth={2.8} />
        <AppText variant="label" color={theme.colors.success}>
          Verified provider
        </AppText>
      </View>
    );
  }

  if (status === "submitted") {
    return (
      <View style={[styles.row, styles.infoRow]}>
        <Clock color={theme.colors.info} size={18} strokeWidth={2.6} />
        <AppText variant="label" color={theme.colors.info} style={styles.rowText}>
          Under review — we'll notify you once approved.
        </AppText>
      </View>
    );
  }

  if (status === "needs_changes" || status === "rejected") {
    return (
      <Card style={styles.warningCard}>
        <View style={styles.warningHead}>
          <View style={styles.iconBox}>
            <AlertTriangle color={theme.colors.warning} size={20} strokeWidth={2.6} />
          </View>
          <View style={styles.warningCopy}>
            <AppText variant="eyebrow" color={theme.colors.warning}>
              {status === "rejected" ? "Verification declined" : "Changes needed"}
            </AppText>
            <AppText variant="title" style={styles.warningTitle}>
              Let's finish verifying
            </AppText>
          </View>
        </View>
        {reason ? (
          <AppText color={theme.colors.foregroundSoft} style={styles.reason}>
            {reason}
          </AppText>
        ) : null}
        {errorMessage ? (
          <AppText variant="label" color={theme.colors.destructive}>
            {errorMessage}
          </AppText>
        ) : null}
        <View style={styles.actionRow}>
          <Button label={submitting ? "Submitting…" : "Resubmit"} onPress={onResubmit} />
          {submitting ? <ActivityIndicator color={theme.colors.primary} style={styles.spinner} /> : null}
        </View>
      </Card>
    );
  }

  // draft or empty — still onboarding, render nothing.
  return null;
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderRadius: theme.radius.md,
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowText: {
    flex: 1,
  },
  successRow: {
    backgroundColor: "rgba(24, 197, 110, 0.12)",
  },
  infoRow: {
    backgroundColor: "rgba(37, 99, 235, 0.1)",
  },
  warningCard: {
    gap: 16,
    marginBottom: 16,
  },
  warningHead: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  iconBox: {
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.14)",
    borderRadius: 16,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  warningCopy: {
    flex: 1,
    gap: 4,
  },
  warningTitle: {
    fontSize: 19,
    lineHeight: 22,
  },
  reason: {
    lineHeight: 21,
  },
  actionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  spinner: {
    position: "absolute",
    right: 22,
  },
});
