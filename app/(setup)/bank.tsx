import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Banknote } from "lucide-react-native";
import { FormField } from "@/src/components/forms/FormField";
import { SetupProgress } from "@/src/components/product/SetupProgress";
import { AppText } from "@/src/components/ui/AppText";
import { BackHeader } from "@/src/components/ui/BackHeader";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { theme } from "@/src/theme/tokens";
import { useAppState } from "@/src/state/AppState";

export default function BankScreen() {
  const { state, completeSetup, updateBank } = useAppState();
  const [iban, setIban] = useState(state.bankIban);
  const [holder, setHolder] = useState(state.accountHolder);

  return (
    <Screen>
      <BackHeader />
      <SetupProgress active={4} />
      <View style={styles.header}>
        <AppText variant="heading">Payout Account</AppText>
        <AppText color={theme.colors.mutedForeground}>
          Where your completed job payments should be sent.
        </AppText>
      </View>
      <Card style={styles.card}>
        <Banknote color={theme.colors.accent} size={30} />
        <View>
          <AppText variant="eyebrow">Current payout</AppText>
          <AppText variant="title">Emirates NBD • 8821</AppText>
        </View>
      </Card>
      <View style={styles.fields}>
        <FormField label="IBAN" placeholder="AE12 0000 0000 0000 0000 000" value={iban} onChangeText={setIban} />
        <FormField label="Account holder" placeholder="Ahmed Rashid" value={holder} onChangeText={setHolder} />
      </View>
      <Button
        label="Start getting jobs"
        onPress={() => {
          updateBank(iban, holder);
          completeSetup();
          router.replace("/(tabs)");
        }}
        style={styles.cta}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
    marginBottom: 20,
  },
  card: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    marginBottom: 22,
  },
  fields: {
    gap: 18,
  },
  cta: {
    marginTop: 28,
  },
});
