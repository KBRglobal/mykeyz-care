import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { BackHeader } from "@/src/components/ui/BackHeader";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { SetupProgress } from "@/src/components/product/SetupProgress";
import { trades } from "@/src/data/mock";
import { useAppState } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

export default function TradeScreen() {
  const { state, toggleTrade } = useAppState();

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
      <Button label={`Continue • ${state.selectedTradeKeys.length} selected`} onPress={() => router.push("/(setup)/coverage")} style={styles.cta} />
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
  cta: {
    marginTop: 28,
  },
});
