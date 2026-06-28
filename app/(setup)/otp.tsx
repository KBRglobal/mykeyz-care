import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View, useWindowDimensions } from "react-native";
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
  const { state, signIn, requestOtp } = useAppState();
  const contentWidth = Math.max(280, Math.min(width - theme.spacing.pageX * 2, 382));
  const cellSize = Math.floor((contentWidth - 5 * 8) / 6);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [seconds, setSeconds] = useState(45);
  const [resending, setResending] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);

  // Real countdown to the resend gate; ticks every second and stops at 0.
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => setSeconds((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const handleResend = async () => {
    if (resending || seconds > 0) return;
    setResending(true);
    setError("");
    try {
      await requestOtp(state.email);
      setSeconds(45);
    } catch {
      setError("Could not resend the code. Try again.");
    } finally {
      setResending(false);
    }
  };

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

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

  // Paste the code from the clipboard (codes arrive by email, so iOS SMS-autofill doesn't help here).
  // Pulls the first 6 digits out of whatever was copied and distributes them across the cells.
  const handlePaste = async () => {
    setError("");
    const raw = await Clipboard.getStringAsync().catch(() => "");
    const cleaned = (raw ?? "").replace(/\D/g, "").slice(0, 6);
    if (!cleaned) {
      setError("No code found on the clipboard");
      return;
    }
    setDigits(() => {
      const next = ["", "", "", "", "", ""];
      for (let i = 0; i < cleaned.length; i += 1) next[i] = cleaned[i];
      return next;
    });
    inputs.current[Math.min(cleaned.length, 6) - 1]?.focus();
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
      await signIn(state.email, code);
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
            We sent a 6-digit code to {state.email}.
          </AppText>
        </View>
        <View style={styles.codeRow}>
          <AppText variant="eyebrow" color={theme.colors.mutedForeground}>
            Enter the 6-digit code
          </AppText>
          <Pressable onPress={handlePaste} hitSlop={8} accessibilityRole="button" accessibilityLabel="Paste code">
            <AppText variant="eyebrow" color={theme.colors.accent}>
              Paste
            </AppText>
          </Pressable>
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
              autoComplete="one-time-code"
              importantForAutofill="yes"
              maxLength={index === 0 ? 6 : 1}
              style={[styles.otpCell, { width: cellSize }, value ? styles.filled : null]}
            />
          ))}
        </View>
        {error ? <AppText color={theme.colors.destructive}>{error}</AppText> : null}
        <Button label={verifying ? "Verifying..." : "Verify code"} onPress={handleVerify} />
        {seconds > 0 ? (
          <AppText variant="eyebrow" align="center" color={theme.colors.mutedForeground}>
            Resend code in {mmss}
          </AppText>
        ) : (
          <Pressable onPress={handleResend} disabled={resending}>
            <AppText variant="eyebrow" align="center" color={theme.colors.accent}>
              {resending ? "Resending..." : "Resend code"}
            </AppText>
          </Pressable>
        )}
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
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: -16,
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
