import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Camera, User } from "lucide-react-native";
import { FormField } from "@/src/components/forms/FormField";
import { SetupProgress } from "@/src/components/product/SetupProgress";
import { AppText } from "@/src/components/ui/AppText";
import { BackHeader } from "@/src/components/ui/BackHeader";
import { Button } from "@/src/components/ui/Button";
import { Screen } from "@/src/components/ui/Screen";
import { theme } from "@/src/theme/tokens";
import { useAppState } from "@/src/state/AppState";

export default function BusinessScreen() {
  const { state, saveBusiness } = useAppState();
  const [businessName, setBusinessName] = useState(state.businessName);
  const [license, setLicense] = useState(state.tradeLicenseNumber);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const onContinue = async () => {
    if (saving) return;
    setError("");
    setSaving(true);
    try {
      await saveBusiness(businessName, license);
      router.push("/(setup)/license");
    } catch {
      setError("Could not save your business profile. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <BackHeader />
      <SetupProgress active={2} />
      <View style={styles.header}>
        <AppText variant="heading">Business Profile</AppText>
        <AppText color={theme.colors.mutedForeground}>
          Let tenants know who they are hiring.
        </AppText>
      </View>
      <View style={styles.logoWrap}>
        <View style={styles.logo}>
          <User color="#CBD5E1" size={52} fill="#CBD5E1" />
          <View style={styles.camera}>
            <Camera color={theme.colors.primary} size={18} />
          </View>
        </View>
        <AppText variant="eyebrow">Upload business logo</AppText>
      </View>
      <View style={styles.fields}>
        <FormField label="Business name" placeholder="e.g. Dubai Pro Cleaners" value={businessName} onChangeText={setBusinessName} />
        <FormField label="Trade license number" placeholder="XXXXXXXXX" value={license} onChangeText={setLicense} />
      </View>
      {error ? <AppText color={theme.colors.destructive} style={styles.error}>{error}</AppText> : null}
      <Button
        label={saving ? "Saving..." : "Complete setup"}
        onPress={onContinue}
        style={styles.cta}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
    marginBottom: 26,
  },
  logoWrap: {
    alignItems: "center",
    gap: 12,
    marginBottom: 30,
  },
  logo: {
    alignItems: "center",
    backgroundColor: theme.colors.muted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    borderWidth: 4,
    height: 126,
    justifyContent: "center",
    width: 126,
  },
  camera: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    bottom: -4,
    height: 38,
    justifyContent: "center",
    position: "absolute",
    right: -4,
    width: 38,
  },
  fields: {
    gap: 18,
  },
  error: {
    marginTop: 16,
  },
  cta: {
    marginTop: 28,
  },
});
