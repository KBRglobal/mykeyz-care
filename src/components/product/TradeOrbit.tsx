import { StyleSheet, View } from "react-native";
import { Home } from "lucide-react-native";
import { AppText } from "@/src/components/ui/AppText";
import { trades } from "@/src/data/mock";
import { theme } from "@/src/theme/tokens";

export function TradeOrbit() {
  return (
    <View style={styles.wrap}>
      <View style={[styles.ring, styles.ringOuter]} />
      <View style={[styles.ring, styles.ringInner]} />
      <View style={styles.home}>
        <Home color={theme.colors.primaryForeground} fill={theme.colors.primaryForeground} size={42} />
      </View>
      {trades.map((trade, index) => {
        const position = positions[index];
        const Icon = trade.icon;
        return (
          <View key={trade.key} style={[styles.trade, position]}>
            <View style={styles.tradeIcon}>
              <Icon color={theme.colors.accent} size={23} strokeWidth={2.8} />
            </View>
            <AppText variant="eyebrow" style={styles.tradeLabel}>
              {trade.label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const positions = [
  { top: 0, left: 108 },
  { top: 78, left: 12 },
  { top: 78, right: 12 },
  { bottom: 20, left: 42 },
  { bottom: 20, right: 42 },
  { bottom: -18, left: 108 },
] as const;

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "center",
    height: 280,
    marginTop: 12,
    overflow: "visible",
    width: 280,
  },
  ring: {
    borderColor: "#EDF3F8",
    borderRadius: 999,
    borderWidth: 1,
    position: "absolute",
  },
  ringOuter: {
    height: 262,
    left: 9,
    top: 9,
    width: 262,
  },
  ringInner: {
    height: 178,
    left: 51,
    top: 51,
    width: 178,
  },
  home: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: 38,
    height: 100,
    justifyContent: "center",
    left: 90,
    position: "absolute",
    top: 90,
    width: 100,
    ...theme.shadows.floating,
  },
  trade: {
    alignItems: "center",
    gap: 7,
    position: "absolute",
  },
  tradeIcon: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    height: 52,
    justifyContent: "center",
    width: 52,
    ...theme.shadows.card,
  },
  tradeLabel: {
    fontSize: 8,
  },
});
