import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BackHeader } from "@/src/components/ui/BackHeader";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { SetupProgress } from "@/src/components/product/SetupProgress";
import { trades } from "@/src/data/catalog";
import { useAppState } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

export default function TradeScreen() {
  const { state, toggleTrade, saveTrades } = useAppState();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const onContinue = async () => {
    if (saving) return;
    setError("");
    if (state.selectedTradeKeys.length === 0) {
      setError("Select at least one trade to continue.");
      return;
    }
    setSaving(true);
    try {
      await saveTrades();
      router.push("/(setup)/coverage");
    } catch {
      setError("Could not save your trades. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <BackHeader />
      <SetupProgress active={1} />
      <View style={styles.header}>
        <AppText variant="heading">Your Trade</AppText>
        <AppText color={theme.colors.mutedForeground}>
          Select the services your business provides. You can change this later.
        </AppText>
      </View>
      <View style={styles.grid}>
        {trades.map((trade, index) => {
          const Icon = trade.icon;
          const selected = state.selectedTradeKeys.includes(trade.key);
          return (
            <Pressable key={trade.key} style={styles.tileWrap} onPress={() => toggleTrade(trade.key)}>
              <Card muted={!selected} style={[styles.tile, selected ? styles.selected : null]}>
                <Icon color={selected ? theme.colors.accent : theme.colors.mutedForeground} size={30} />
                <AppText
                  variant="label"
                  color={selected ? theme.colors.primaryForeground : theme.colors.foreground}
                  style={styles.tileLabel}
                >
                  {trade.label}
                </AppText>
              </Card>
            </Pressable>
          );
        })}
      </View>
      {error ? <AppText color={theme.colors.destructive} style={styles.error}>{error}</AppText> : null}
      <Button
        label={saving ? "Saving..." : `Continue • ${state.selectedTradeKeys.length} selected`}
        onPress={onContinue}
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  tileWrap: {
    width: "48%",
  },
  tile: {
    gap: 18,
    minHeight: 126,
    padding: 18,
  },
  selected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tileLabel: {
    textTransform: "uppercase",
  },
  error: {
    marginTop: 16,
  },
  cta: {
    marginTop: 28,
  },
});
