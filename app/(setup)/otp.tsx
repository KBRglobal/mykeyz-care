import { router } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, TextInput, View, useWindowDimensions } from "react-native";
import { BackHeader } from "@/src/components/ui/BackHeader";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { Screen } from "@/src/components/ui/Screen";
import { theme } from "@/src/theme/tokens";
import { useAppState } from "@/src/state/AppState";

const ERRORS: Record<string, string> = {
  otp_expired: "Code expired, request a new one",
  invalid_otp: "Incorrect code",
  otp_blocked: "Too many attempts",
};

export default function OtpScreen() {
  const { width } = useWindowDimensions();
  const { state, signIn } = useAppState();
  const contentWidth = Math.max(280, Math.min(width - theme.spacing.pageX * 2, 382));
  const cellSize = Math.floor((contentWidth - 5 * 8) / 6);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "");
    // SMS autofill / paste can deliver the whole code into one field — distribute it across the cells.
    if (cleaned.length > 1) {
      setDigits((current) => {
        const next = [...current];
        for (let i = 0; i < 6; i += 1) next[i] = cleaned[i] ?? "";
        return next;
      });
      const last = Math.min(cleaned.length, 6) - 1;
      inputs.current[last]?.focus();
      return;
    }
    const digit = cleaned.slice(-1);
    setDigits((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });
    if (digit && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (verifying) return;
    const code = digits.join("");
    if (code.length < 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setError("");
    setVerifying(true);
    try {
      await signIn(state.phone, code);
      router.replace("/(setup)/trade");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "invalid_otp";
      setError(ERRORS[message] ?? "Incorrect code");
      setDigits(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Screen scroll={false} style={styles.root}>
      <BackHeader />
      <View style={styles.body}>
        <View>
          <AppText variant="heading">Verification</AppText>
          <AppText color={theme.colors.mutedForeground}>
            We sent a 6-digit code to {state.phone}.
          </AppText>
        </View>
        <View style={styles.otp}>
          {digits.map((value, index) => (
            <TextInput
              key={index}
              ref={(node) => {
                inputs.current[index] = node;
              }}
              value={value}
              onChangeText={(text) => handleChange(index, text)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              importantForAutofill="yes"
              maxLength={index === 0 ? 6 : 1}
              style={[styles.otpCell, { width: cellSize }, value ? styles.filled : null]}
            />
          ))}
        </View>
        {error ? <AppText color={theme.colors.destructive}>{error}</AppText> : null}
        <Button label={verifying ? "Verifying..." : "Verify code"} onPress={handleVerify} />
        <AppText variant="eyebrow" align="center">
          Resend code in 00:45
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: theme.colors.surface,
  },
  body: {
    gap: 32,
    width: "100%",
  },
  otp: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  otpCell: {
    backgroundColor: theme.colors.muted,
    borderRadius: 12,
    color: theme.colors.foreground,
    fontFamily: theme.fonts.heading,
    fontSize: 18,
    height: 50,
    minWidth: 0,
    textAlign: "center",
  },
  filled: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
});
