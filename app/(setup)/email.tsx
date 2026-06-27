import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { AppText } from "@/src/components/ui/AppText";
import { BrandMark } from "@/src/components/ui/BrandMark";
import { Button } from "@/src/components/ui/Button";
import { Screen } from "@/src/components/ui/Screen";
import { useAppState } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

// Temporary email-based sign-in. Phone delivery comes later; see phone.tsx (kept, dormant).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailScreen() {
  const { state, setEmail, requestOtp } = useAppState();
  const [email, updateEmail] = useState(state.email || "");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const handleContinue = async () => {
    if (sending) return;
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setSending(true);
    setEmail(value);
    try {
      await requestOtp(value);
      router.push("/(setup)/otp");
    } catch {
      setError("Could not send the code. Check the address and try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen scroll={false} style={styles.root} contentStyle={styles.content}>
      <View style={styles.brand}>
        <BrandMark />
        <AppText variant="heading" style={styles.logoWord}>
          Care
        </AppText>
      </View>
      <View style={styles.form}>
        <AppText variant="eyebrow" align="center">
          Enter your email
        </AppText>
        <TextInput
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="you@example.com"
          placeholderTextColor="#D7E0EA"
          value={email}
          onChangeText={updateEmail}
          onSubmitEditing={handleContinue}
          returnKeyType="go"
          style={styles.email}
        />
        {error ? (
          <AppText color={theme.colors.destructive}>{error}</AppText>
        ) : null}
        <Button label={sending ? "Sending..." : "Continue"} onPress={handleContinue} />
      </View>
      <AppText variant="eyebrow" align="center" style={styles.legal}>
        By continuing, you agree to the Service Terms and Privacy Policy
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: theme.colors.surface,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  brand: {
    alignItems: "center",
    gap: 12,
    marginBottom: 70,
  },
  logoWord: {
    color: "#CBD5E1",
    fontSize: 28,
    textTransform: "lowercase",
  },
  form: {
    gap: 22,
    width: "100%",
  },
  email: {
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 2,
    color: theme.colors.foreground,
    fontFamily: theme.fonts.heading,
    fontSize: 24,
    paddingBottom: 14,
    width: "100%",
  },
  legal: {
    bottom: 12,
    color: "#CBD5E1",
    left: 0,
    position: "absolute",
    right: 0,
  },
});
