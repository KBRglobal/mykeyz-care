import { StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle2, Download } from "lucide-react-native";
import { AppText } from "@/src/components/ui/AppText";
import { BackHeader } from "@/src/components/ui/BackHeader";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { theme } from "@/src/theme/tokens";
import { useAppState } from "@/src/state/AppState";

export default function JobCompleteScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { state, completeJob } = useAppState();
  const job = state.activeJobs.find((item) => item.id === id) ?? state.activeJobs.find((item) => !item.completed) ?? state.activeJobs[0];
  const gross = job?.price ?? 0;
  const commission = Math.round(gross * 0.1);
  const net = gross - commission;

  return (
    <Screen>
      <BackHeader />
      <View style={styles.hero}>
        <View style={styles.success}>
          <CheckCircle2 color={theme.colors.success} fill={theme.colors.success} size={44} />
        </View>
        <AppText variant="eyebrow">Job completed</AppText>
        <AppText variant="heading" align="center">
          Earnings Summary
        </AppText>
      </View>
      <Card muted style={styles.summary}>
        <View style={styles.line}>
          <AppText variant="eyebrow">Paid by customer</AppText>
          <AppText variant="label">AED {gross}.00</AppText>
        </View>
        <View style={styles.line}>
          <AppText variant="eyebrow">Commission owed to MyKeyz • 10%</AppText>
          <AppText variant="label" color={theme.colors.warning}>
            AED {commission}.00
          </AppText>
        </View>
        <View style={styles.divider} />
        <View style={styles.line}>
          <AppText variant="label">You keep</AppText>
          <AppText variant="title" color={theme.colors.accent}>
            AED {net}.00
          </AppText>
        </View>
      </Card>
      <AppText variant="eyebrow" align="center" color={theme.colors.mutedForeground} style={styles.note}>
        The customer pays you directly. Commission is what you owe MyKeyz — settled in the app later.
      </AppText>
      <Card style={styles.customer}>
        <View>
          <AppText variant="eyebrow">Customer</AppText>
          <AppText variant="title" style={styles.customerTitle}>
            {job?.customer ?? "Customer"}
          </AppText>
        </View>
        <View>
          <AppText variant="eyebrow">Location</AppText>
          <AppText color={theme.colors.mutedForeground}>
            {job?.area ?? "Dubai"}
          </AppText>
        </View>
      </Card>
      <Button
        label="Mark complete & download invoice"
        onPress={() => {
          completeJob(job?.id);
          router.replace("/(tabs)/jobs");
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  success: {
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderRadius: theme.radius.full,
    height: 74,
    justifyContent: "center",
    width: 74,
  },
  summary: {
    gap: 18,
    marginBottom: 12,
  },
  note: {
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  line: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  divider: {
    backgroundColor: theme.colors.border,
    height: 1,
  },
  customer: {
    gap: 16,
    marginBottom: 22,
  },
  customerTitle: {
    fontSize: 19,
  },
});
