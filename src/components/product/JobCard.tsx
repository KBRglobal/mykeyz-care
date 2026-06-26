import { Linking, StyleSheet, View } from "react-native";
import { CalendarDays, MessageCircle, Navigation } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { openWhatsAppDraft } from "@/src/integrations/whatsapp";
import { theme } from "@/src/theme/tokens";
import type { ActiveJob, QuoteState } from "@/src/state/AppState";

const quoteBadge: Record<QuoteState, { label: string; color: string }> = {
  pending: { label: "Quote sent", color: theme.colors.info },
  won: { label: "You won this job", color: theme.colors.success },
  lost: { label: "Not selected", color: theme.colors.mutedForeground },
  withdrawn: { label: "Withdrawn", color: theme.colors.mutedForeground },
};

export function JobCard({ job }: { job: ActiveJob }) {
  const { t } = useTranslation();
  const message = `Hi ${job.customer}, this is your MyKeyz provider. I am confirming ${job.title} in ${job.area} for ${job.when}.`;
  const badge = job.quoteState ? quoteBadge[job.quoteState] : null;
  const isWon = job.quoteState === "won";

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View>
          <AppText variant="title" style={styles.title}>
            {job.title}
          </AppText>
          <AppText variant="eyebrow">
            {job.customer} • {job.area}
          </AppText>
        </View>
        <View style={styles.price}>
          <AppText variant="label">AED {job.price}</AppText>
          {badge ? (
            <AppText variant="eyebrow" color={badge.color}>
              {badge.label}
            </AppText>
          ) : (
            <AppText variant="eyebrow" style={styles.status}>
              {job.status}
            </AppText>
          )}
        </View>
      </View>
      <View style={styles.time}>
        <CalendarDays color={theme.colors.mutedForeground} size={21} />
        <View>
          <AppText variant="label">{job.when}</AppText>
          <AppText variant="eyebrow">Estimated duration: 3h</AppText>
        </View>
      </View>
      <View style={styles.actions}>
        <Button
          label={t("message")}
          tone="secondary"
          style={styles.button}
          onPress={() => openWhatsAppDraft(undefined, message)}
        />
        <Button
          label={t("navigate")}
          style={styles.button}
          onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.area)}`)}
        />
      </View>
      {isWon || !job.quoteState ? (
        <Button label="Complete job" tone="accent" onPress={() => router.push(`/job-complete?id=${job.id}`)} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 18,
  },
  header: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 20,
    lineHeight: 22,
  },
  price: {
    alignItems: "flex-end",
  },
  status: {
    color: theme.colors.info,
  },
  time: {
    alignItems: "center",
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.md,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    height: 56,
  },
});
