import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Check, MessageCircle, Trophy } from "lucide-react-native";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { openWhatsAppDraft } from "@/src/integrations/whatsapp";
import { theme } from "@/src/theme/tokens";
import { useAppState } from "@/src/state/AppState";

export default function QuoteSuccessScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { state } = useAppState();
  const job = state.jobs.find((item) => item.id === id) ?? state.jobs[0];

  return (
    <Screen scroll={false} contentStyle={styles.content}>
      <View style={styles.center}>
        <View style={styles.check}>
          <Check color={theme.colors.primary} size={44} strokeWidth={3.4} />
        </View>
        <AppText variant="heading" align="center">
          Bid Sent!
        </AppText>
        <AppText color={theme.colors.mutedForeground} align="center">
          Your quote is now with the customer. We will notify you when they view or accept it.
        </AppText>
      </View>
      <Card style={styles.summary}>
        <Trophy color={theme.colors.accent} fill={theme.colors.accent} size={24} />
        <View style={styles.summaryCopy}>
          <AppText variant="eyebrow">Your quote</AppText>
          <AppText variant="title">AED {job.quote ?? 0}</AppText>
        </View>
      </Card>
      <View style={styles.actions}>
        <Button
          label="Send WhatsApp follow-up"
          tone="accent"
          onPress={() =>
            openWhatsAppDraft(
              undefined,
              `Hi, I sent my MyKeyz quote for ${job.title} in ${job.area}: AED ${job.quote ?? 0}. I can help if you choose my offer.`,
            )
          }
        />
        <Button label="Reveal price" onPress={() => router.replace(`/reveal/${id ?? "job-1"}`)} />
        <Button label="Back to opportunities" tone="secondary" onPress={() => router.replace("/(tabs)/quotes")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "center",
  },
  center: {
    alignItems: "center",
    gap: 14,
    marginBottom: 32,
  },
  check: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: 28,
    height: 92,
    justifyContent: "center",
    width: 92,
  },
  summary: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    marginBottom: 22,
  },
  summaryCopy: {
    flex: 1,
  },
  actions: {
    gap: 12,
  },
});
