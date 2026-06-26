import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Mic, Sparkles } from "lucide-react-native";
import { VoiceHelp } from "@/src/components/product/VoiceHelp";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { getPriceInsight } from "@/src/lib/pricing";
import { parsePriceFromSpeech } from "@/src/lib/voicePrice";
import { startPriceRecognition } from "@/src/integrations/speechRecognition";
import { useAppState } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

export default function SubmitQuoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, sendQuote } = useAppState();
  const job = state.jobs.find((item) => item.id === id) ?? state.jobs[0];
  const isApproved = state.verificationStatus === "approved";
  const insight = job ? getPriceInsight(job) : { low: 0, high: 0, win: 0, recommended: 0, marginAfterFee: 0 };
  const [amount, setAmount] = useState(job ? String(job.quote ?? insight.recommended) : "0");

  if (!job) {
    return (
      <Screen>
        <ArrowLeft color={theme.colors.primary} size={26} onPress={() => router.back()} />
        <View style={styles.header}>
          <AppText variant="heading">Job not available</AppText>
          <AppText color={theme.colors.mutedForeground}>This job is no longer in your matched feed.</AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ArrowLeft color={theme.colors.primary} size={26} onPress={() => router.back()} />
      <View style={styles.header}>
        <AppText variant="eyebrow">Your quote</AppText>
        <AppText variant="heading">{job.title}</AppText>
        <VoiceHelp
          text={`This is a ${job.trade} job in ${job.area}. The normal winning price is around ${insight.recommended} dirhams. Enter your final price and send the quote.`}
        />
      </View>
      <Card style={styles.jobCard}>
        <View style={styles.jobMeta}>
          <AppText variant="eyebrow">{job.trade}</AppText>
          <AppText variant="label">{job.area} • {job.distance}</AppText>
        </View>
        <AppText color={theme.colors.mutedForeground}>{job.issue}</AppText>
      </Card>
      <Card style={styles.voice}>
        <View style={styles.mic}>
          <Mic color={theme.colors.primaryForeground} size={42} />
        </View>
        <AppText variant="label" align="center">
          Voice quote ready for native build
        </AppText>
        <AppText color={theme.colors.mutedForeground} align="center">
          Expo Go supports the spoken help. Live speech input will use a dev client build.
        </AppText>
        <Button
          label="Dictate price"
          tone="secondary"
          onPress={async () => {
            await startPriceRecognition((transcript) => {
              const parsed = parsePriceFromSpeech(transcript);
              if (parsed) setAmount(String(parsed));
            });
          }}
        />
      </Card>
      <Card muted style={styles.inputCard}>
        <AppText variant="eyebrow">Final price</AppText>
        <View style={styles.inputRow}>
          <AppText variant="title">AED</AppText>
          <TextInput
            keyboardType="number-pad"
            value={amount}
            onChangeText={setAmount}
            style={styles.input}
            placeholderTextColor={theme.colors.mutedForeground}
          />
        </View>
      </Card>
      <Card muted style={styles.hint}>
        <View style={styles.hintTop}>
          <Sparkles color={theme.colors.accent} size={22} />
          <View style={styles.hintText}>
            <AppText variant="label">Smart price range</AppText>
            <AppText color={theme.colors.mutedForeground}>
              AED {insight.low}-{insight.high}. Recommended: AED {insight.recommended}. After MyKeyz fee you keep AED {insight.marginAfterFee}.
            </AppText>
          </View>
        </View>
        <Pressable style={styles.usePrice} onPress={() => setAmount(String(insight.recommended))}>
          <CheckCircle2 color={theme.colors.success} size={18} />
          <AppText variant="eyebrow" color={theme.colors.primary}>
            Use recommended price
          </AppText>
        </Pressable>
      </Card>
      {isApproved ? (
        <Button
          label={`Send quote • AED ${amount || "0"}`}
          onPress={() => {
            sendQuote(job.id, Number(amount) || 0);
            router.replace(`/quote-success?id=${job.id}`);
          }}
        />
      ) : (
        <Card muted style={styles.gate}>
          <AppText variant="label">Verification required</AppText>
          <AppText color={theme.colors.mutedForeground}>
            You need an approved verification before you can send quotes.
          </AppText>
          <Button label="Get verified" tone="secondary" onPress={() => router.push("/(tabs)")} />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
    marginBottom: 20,
    marginTop: 24,
  },
  jobCard: {
    gap: 12,
    marginBottom: 16,
  },
  jobMeta: {
    gap: 4,
  },
  voice: {
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  mic: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    height: 120,
    justifyContent: "center",
    width: 120,
  },
  inputCard: {
    gap: 8,
    marginBottom: 16,
  },
  inputRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  input: {
    color: theme.colors.accent,
    flex: 1,
    fontFamily: theme.fonts.heading,
    fontSize: 54,
  },
  hint: {
    gap: 12,
    marginBottom: 20,
  },
  gate: {
    gap: 12,
  },
  hintTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  hintText: {
    flex: 1,
  },
  usePrice: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
});
