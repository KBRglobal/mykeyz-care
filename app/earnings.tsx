import { StyleSheet, View } from "react-native";
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
  const hasTransactions = earnings.transactions.length > 0;

  return (
    <Screen>
      <BackHeader />
      <View style={styles.head}>
        <AppText variant="heading">Earnings</AppText>
      </View>

      <View style={styles.stats}>
        <Card style={styles.stat}>
          <AppText variant="eyebrow">This week</AppText>
          <AppText variant="title">{earnings.week} AED</AppText>
          <AppText variant="eyebrow" color={theme.colors.mutedForeground}>
            Paid by customers
          </AppText>
        </Card>
        <Card style={[styles.stat, styles.month]}>
          <AppText variant="eyebrow" color="#8BA6CC">
            This month
          </AppText>
          <AppText variant="title" color={theme.colors.primaryForeground}>
            {earnings.month} AED
          </AppText>
          <AppText variant="eyebrow" color="#8BA6CC">
            Paid by customers
          </AppText>
        </Card>
      </View>

      <Card style={styles.totals}>
        <View style={styles.totalRow}>
          <View style={styles.totalLabel}>
            <AppText variant="label">Total gross</AppText>
            <AppText variant="eyebrow" color={theme.colors.mutedForeground}>
              Paid to you by customers
            </AppText>
          </View>
          <AppText variant="title" style={styles.totalValue}>
            AED {earnings.totalGross}
          </AppText>
        </View>
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <View style={styles.totalLabel}>
            <AppText variant="label">You keep</AppText>
            <AppText variant="eyebrow" color={theme.colors.mutedForeground}>
              Net after MyKeyz commission
            </AppText>
          </View>
          <AppText variant="title" color={theme.colors.success} style={styles.totalValue}>
            AED {earnings.totalNet}
          </AppText>
        </View>
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <View style={styles.totalLabel}>
            <AppText variant="label">Commission owed to MyKeyz</AppText>
            <AppText variant="eyebrow" color={theme.colors.mutedForeground}>
              You owe this — collected in-app later
            </AppText>
          </View>
          <AppText variant="title" color={theme.colors.warning} style={styles.totalValue}>
            AED {earnings.commissionOwed}
          </AppText>
        </View>
      </Card>

      <Card style={styles.chart}>
        <View style={styles.chartHeader}>
          <AppText variant="eyebrow">Weekly gross</AppText>
          <AppText variant="eyebrow" color={theme.colors.info}>
            Total AED {earnings.totalGross}
          </AppText>
        </View>
        {earnings.bars.length ? (
          <View style={styles.bars}>
            {earnings.bars.map((value, index) => (
              <View key={index} style={styles.barWrap}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${Math.round((value / max) * 100)}%`,
                        backgroundColor: index === earnings.bars.length - 1 ? theme.colors.primary : theme.colors.mutedStrong,
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
        ) : (
          <AppText variant="eyebrow" color={theme.colors.mutedForeground}>
            No weekly earnings yet
          </AppText>
        )}
      </Card>

      <AppText variant="eyebrow" style={styles.txHeading}>
        Completed jobs
      </AppText>
      {hasTransactions ? (
        earnings.transactions.map((item) => (
          <Card key={item.id} muted style={styles.payout}>
            <View style={styles.payoutMain}>
              <AppText variant="label">{item.jobName}</AppText>
              <AppText variant="eyebrow" color={theme.colors.mutedForeground}>
                Gross AED {item.grossAmount} • Commission AED {item.commission}
              </AppText>
            </View>
            <View style={styles.payoutNet}>
              <AppText variant="eyebrow" color={theme.colors.mutedForeground}>
                You keep
              </AppText>
              <AppText variant="label" color={theme.colors.success}>
                AED {item.netAmount}
              </AppText>
            </View>
          </Card>
        ))
      ) : (
        <Card muted style={styles.empty}>
          <AppText variant="label" align="center">
            No completed jobs yet
          </AppText>
          <AppText variant="eyebrow" align="center" color={theme.colors.mutedForeground}>
            Win and complete a job to see your earnings here.
          </AppText>
        </Card>
      )}
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
  totals: {
    gap: 16,
    marginBottom: 16,
  },
  totalRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  totalLabel: {
    flex: 1,
    gap: 4,
  },
  totalValue: {
    fontSize: 20,
  },
  divider: {
    backgroundColor: theme.colors.border,
    height: 1,
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
  txHeading: {
    marginBottom: 10,
  },
  payout: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  payoutMain: {
    flex: 1,
    gap: 4,
  },
  payoutNet: {
    alignItems: "flex-end",
    gap: 4,
  },
  empty: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 28,
  },
});
