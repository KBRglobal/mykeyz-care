import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { AppText } from "@/src/components/ui/AppText";
import { BrandMark } from "@/src/components/ui/BrandMark";
import { Button } from "@/src/components/ui/Button";
import { Screen } from "@/src/components/ui/Screen";
import { useAppState } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

export default function PhoneScreen() {
  const { state, setPhone } = useAppState();
  const [phone, updatePhone] = useState(state.phone || "");

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
          Enter phone number
        </AppText>
        <View style={styles.phoneRow}>
          <View style={styles.country}>
            <AppText variant="label">AE</AppText>
            <AppText variant="title" style={styles.code}>
              +971
            </AppText>
          </View>
          <TextInput
            keyboardType="phone-pad"
            placeholder="5X XXX XXXX"
            placeholderTextColor="#D7E0EA"
            value={phone}
            onChangeText={updatePhone}
            style={styles.phone}
          />
        </View>
        <Button
          label="Continue"
          onPress={() => {
            setPhone(phone);
            router.push("/(setup)/otp");
          }}
        />
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
  phoneRow: {
    alignItems: "center",
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 2,
    flexDirection: "row",
    gap: 14,
    paddingBottom: 14,
    width: "100%",
  },
  country: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  code: {
    fontSize: 20,
  },
  phone: {
    color: theme.colors.foreground,
    flex: 1,
    fontFamily: theme.fonts.heading,
    fontSize: 24,
    minWidth: 0,
  },
  legal: {
    bottom: 12,
    color: "#CBD5E1",
    left: 0,
    position: "absolute",
    right: 0,
  },
});
