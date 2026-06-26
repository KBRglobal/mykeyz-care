import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { CheckCircle2, FileUp } from "lucide-react-native";
import { SetupProgress } from "@/src/components/product/SetupProgress";
import { AppText } from "@/src/components/ui/AppText";
import { BackHeader } from "@/src/components/ui/BackHeader";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { verificationBenefits } from "@/src/data/mock";
import { theme } from "@/src/theme/tokens";

export default function LicenseScreen() {
  return (
    <Screen>
      <BackHeader />
      <SetupProgress active={3} />
      <View style={styles.header}>
        <AppText variant="heading" align="center">
          Verification
        </AppText>
        <AppText color={theme.colors.mutedForeground} align="center">
          Required to bid on premium jobs.
        </AppText>
      </View>
      <Card muted style={styles.upload}>
        <View style={styles.uploadIcon}>
          <FileUp color={theme.colors.accent} size={34} />
        </View>
        <AppText variant="label" align="center">
          Upload trade license
        </AppText>
        <AppText variant="eyebrow" align="center">
          PDF or image, max 10MB
        </AppText>
      </Card>
      <Card muted style={styles.benefits}>
        <AppText variant="eyebrow">Why verify?</AppText>
        {verificationBenefits.map((item) => (
          <View key={item.title} style={styles.benefit}>
            <CheckCircle2 color={theme.colors.success} fill={theme.colors.success} size={20} />
            <View style={styles.benefitCopy}>
              <AppText variant="label">{item.title}</AppText>
              <AppText color={theme.colors.mutedForeground}>{item.body}</AppText>
            </View>
          </View>
        ))}
      </Card>
      <Button label="Submit for review" onPress={() => router.push("/(setup)/bank")} style={styles.cta} />
      <Button label="Skip for now" tone="secondary" onPress={() => router.push("/(setup)/bank")} style={styles.skip} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
    marginBottom: 24,
  },
  upload: {
    alignItems: "center",
    borderStyle: "dashed",
    borderWidth: 2,
    gap: 12,
    marginBottom: 16,
    minHeight: 190,
    justifyContent: "center",
  },
  uploadIcon: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  benefits: {
    gap: 16,
  },
  benefit: {
    flexDirection: "row",
    gap: 12,
  },
  benefitCopy: {
    flex: 1,
    gap: 2,
  },
  cta: {
    marginTop: 24,
  },
  skip: {
    marginTop: 12,
  },
});
