import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BatteryLow, Crown } from "lucide-react-native";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { theme } from "@/src/theme/tokens";
import { useAppState } from "@/src/state/AppState";

export default function CreditsScreen() {
  const { state, purchaseReveal } = useAppState();
  const [busy, setBusy] = useState(false);

  const onBuy = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    const result = await purchaseReveal();
    setBusy(false);
    if (result.ok) router.back();
  }, [busy, purchaseReveal]);

  return (
    <Screen scroll={false} style={styles.root} contentStyle={styles.content}>
      <View style={styles.center}>
        <View style={styles.icon}>
          <BatteryLow color="#CBD5E1" size={72} fill="#CBD5E1" />
        </View>
        <AppText variant="heading" align="center">
          No Credits Left
        </AppText>
        <AppText variant="eyebrow" align="center" style={styles.body}>
          You have {state.revealCredits} reveal credits left this month.
        </AppText>
      </View>
      <View style={styles.options}>
        <Card style={styles.proPack}>
          <View>
            <AppText variant="eyebrow" color={theme.colors.accent}>
              Pro pack
            </AppText>
            <AppText variant="title" color={theme.colors.primaryForeground}>
              1 Reveal
            </AppText>
          </View>
          <AppText variant="title" color={theme.colors.primaryForeground}>
            AED 49
          </AppText>
        </Card>
        <Pressable onPress={() => router.push("/plans")}>
          <Card muted style={styles.subscription}>
            <View style={styles.rowLeft}>
              <Crown color={theme.colors.accent} fill={theme.colors.accent} size={26} />
              <View>
                <AppText variant="eyebrow">Subscription</AppText>
                <AppText variant="title" style={styles.optionTitle}>
                  See all plans
                </AppText>
              </View>
            </View>
            <AppText variant="eyebrow" color={theme.colors.info}>
              Upgrade
            </AppText>
          </Card>
        </Pressable>
      </View>
      <Button label={busy ? "Working…" : "Buy 1 reveal"} onPress={onBuy} />
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
  center: {
    alignItems: "center",
    gap: 18,
    marginBottom: 42,
  },
  icon: {
    alignItems: "center",
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.xl,
    height: 128,
    justifyContent: "center",
    width: 128,
  },
  body: {
    maxWidth: 260,
  },
  options: {
    gap: 12,
    marginBottom: 24,
  },
  proPack: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  subscription: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  optionTitle: {
    fontSize: 18,
  },
});
