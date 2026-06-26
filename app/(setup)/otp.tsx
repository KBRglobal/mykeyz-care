import { router } from "expo-router";
import { StyleSheet, TextInput, View, useWindowDimensions } from "react-native";
import { BackHeader } from "@/src/components/ui/BackHeader";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { Screen } from "@/src/components/ui/Screen";
import { theme } from "@/src/theme/tokens";
import { useAppState } from "@/src/state/AppState";

export default function OtpScreen() {
  const { width } = useWindowDimensions();
  const { state } = useAppState();
  const contentWidth = Math.max(280, Math.min(width - theme.spacing.pageX * 2, 382));
  const cellSize = Math.floor((contentWidth - 5 * 8) / 6);

  return (
    <Screen scroll={false} style={styles.root}>
      <BackHeader />
      <View style={styles.body}>
        <View>
          <AppText variant="heading">Verification</AppText>
          <AppText color={theme.colors.mutedForeground}>
            We sent a 6-digit code to +971 {state.phone || "50 123 4567"}.
          </AppText>
        </View>
        <View style={styles.otp}>
          {["5", "2", "9", "", "", ""].map((value, index) => (
            <TextInput
              key={index}
              defaultValue={value}
              keyboardType="number-pad"
              maxLength={1}
              style={[styles.otpCell, { width: cellSize }, value ? styles.filled : null]}
            />
          ))}
        </View>
        <Button label="Verify code" onPress={() => router.push("/(setup)/trade")} />
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
