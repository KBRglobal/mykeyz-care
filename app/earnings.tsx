import { StyleSheet, View } from "react-native";
import { Download, TrendingUp } from "lucide-react-native";
import { AppText } from "@/src/components/ui/AppText";
import { BackHeader } from "@/src/components/ui/BackHeader";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { useAppState } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

export default function EarningsScreen() {
  const { state } = useAppState();
  const earnings = state.earnings;
  const max = Math.max(...earnings.bars, 1);

  return (
    <Screen>
      <BackHeader />
      <View style={styles.head}>
        <AppText variant="heading">Earnings</AppText>
        <View style={styles.export}>
          <Download color={theme.colors.primary} size={20} />
        </View>
      </View>
      <View style={styles.stats}>
        <Card style={styles.stat}>
          <AppText variant="eyebrow">This week</AppText>
          <AppText variant="title">{earnings.week} AED</AppText>
          <View style={styles.trend}>
            <TrendingUp color={theme.colors.success} size={14} />
            <AppText variant="eyebrow" color={theme.colors.success}>
              +12%
            </AppText>
          </View>
        </Card>
        <Card style={[styles.stat, styles.month]}>
          <AppText variant="eyebrow" color="#8BA6CC">
            This month
          </AppText>
          <AppText variant="title" color={theme.colors.primaryForeground}>
            {earnings.month} AED
          </AppText>
          <AppText variant="eyebrow" color="#8BA6CC">
            Payout: 1st July
          </AppText>
        </Card>
      </View>
      <Card style={styles.chart}>
        <View style={styles.chartHeader}>
          <AppText variant="eyebrow">8-week performance</AppText>
          <AppText variant="eyebrow" color={theme.colors.info}>
            Total {Math.round(earnings.total / 100) / 10}K AED
          </AppText>
        </View>
        <View style={styles.bars}>
          {earnings.bars.map((value, index) => (
            <View key={index} style={styles.barWrap}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${Math.round((value / max) * 100)}%`,
                      backgroundColor: index > 4 ? theme.colors.info : index === 3 ? theme.colors.primary : theme.colors.mutedStrong,
                    },
                  ]}
                />
              </View>
              <AppText variant="eyebrow" style={styles.week}>
                W{index + 1}
              </AppText>
            </View>
          ))}
        </View>
      </Card>
      {(earnings.transactions.length ? earnings.transactions : [{ id: "pending", jobName: "No completed payouts yet", netAmount: 0, commission: 0, grossAmount: 0 }]).map((item) => (
        <Card key={item.id} muted style={styles.payout}>
          <View>
            <AppText variant="label">{item.jobName}</AppText>
            <AppText variant="eyebrow">After 10% commission</AppText>
          </View>
          <AppText variant="label" color={theme.colors.success}>
            +{item.netAmount} AED
          </AppText>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  export: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  stats: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    gap: 8,
    padding: 18,
  },
  month: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  trend: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  chart: {
    gap: 18,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bars: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 8,
    height: 168,
  },
  barWrap: {
    alignItems: "center",
    flex: 1,
    gap: 8,
    height: "100%",
  },
  barTrack: {
    flex: 1,
    justifyContent: "flex-end",
    width: "100%",
  },
  bar: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    width: "100%",
  },
  week: {
    fontSize: 7,
  },
  payout: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
});
