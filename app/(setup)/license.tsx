import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { CheckCircle2, FileUp } from "lucide-react-native";
import { SetupProgress } from "@/src/components/product/SetupProgress";
import { AppText } from "@/src/components/ui/AppText";
import { BackHeader } from "@/src/components/ui/BackHeader";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { verificationBenefits } from "@/src/data/catalog";
import { theme } from "@/src/theme/tokens";
import { useAppState } from "@/src/state/AppState";

export default function LicenseScreen() {
  const { state, uploadLicense, submitVerification } = useAppState();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const onPickLicense = async () => {
    if (uploading) return;
    setUploadError("");
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      if (file.size && file.size > 10 * 1024 * 1024) {
        setUploadError("File is too large. Please upload a PDF or image under 10MB.");
        return;
      }
      setUploading(true);
      await uploadLicense(file.uri, file.mimeType ?? "application/pdf");
    } catch {
      setUploadError("Could not upload your license. Please check your connection and try again.");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async () => {
    if (submitting) return;
    setSubmitError("");
    setSubmitting(true);
    try {
      await submitVerification();
      router.push("/(setup)/review");
    } catch (err) {
      if (err instanceof Error && err.message === "incomplete_profile") {
        setSubmitError("Add your trades, areas, business details and license first.");
      } else {
        setSubmitError("Could not submit for review. Please check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const uploaded = Boolean(state.licenseDocUrl);

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
      {uploaded ? (
        <Card muted style={[styles.upload, styles.uploaded]}>
          <View style={[styles.uploadIcon, styles.uploadedIcon]}>
            <CheckCircle2 color={theme.colors.success} size={34} />
          </View>
          <AppText variant="label" align="center">
            License uploaded
          </AppText>
          <Pressable onPress={onPickLicense} disabled={uploading}>
            <AppText variant="eyebrow" align="center" color={theme.colors.accent}>
              {uploading ? "Uploading..." : "Replace file"}
            </AppText>
          </Pressable>
        </Card>
      ) : (
        <Pressable onPress={onPickLicense} disabled={uploading}>
          <Card muted style={styles.upload}>
            <View style={styles.uploadIcon}>
              <FileUp color={theme.colors.accent} size={34} />
            </View>
            <AppText variant="label" align="center">
              {uploading ? "Uploading..." : "Upload trade license"}
            </AppText>
            <AppText variant="eyebrow" align="center">
              PDF or image, max 10MB
            </AppText>
          </Card>
        </Pressable>
      )}
      {uploadError ? <AppText color={theme.colors.destructive} style={styles.error}>{uploadError}</AppText> : null}
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
      {submitError ? <AppText color={theme.colors.destructive} style={styles.error}>{submitError}</AppText> : null}
      <Button
        label={submitting ? "Submitting..." : uploaded ? "Submit for review" : "Upload your license to continue"}
        onPress={onSubmit}
        disabled={!uploaded || submitting}
        style={styles.cta}
      />
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
  uploaded: {
    borderStyle: "solid",
    borderColor: theme.colors.success,
  },
  uploadIcon: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  uploadedIcon: {
    backgroundColor: theme.colors.muted,
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
  error: {
    marginBottom: 12,
  },
  cta: {
    marginTop: 24,
  },
  skip: {
    marginTop: 12,
  },
});
