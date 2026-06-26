import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { CheckCircle2, Crown } from "lucide-react-native";
import { AppText } from "@/src/components/ui/AppText";
import { BackHeader } from "@/src/components/ui/BackHeader";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { plans } from "@/src/data/mock";
import { theme } from "@/src/theme/tokens";

export default function PlansScreen() {
  const elite = plans[4];

  return (
    <Screen>
      <BackHeader />
      <View style={styles.title}>
        <AppText variant="eyebrow" align="center">
          Upgrade your business
        </AppText>
        <AppText variant="heading" align="center">
          Elite Partner
        </AppText>
      </View>
      <Card style={styles.elite}>
        <View style={styles.eliteTop}>
          <View style={styles.crown}>
            <Crown color={theme.colors.accent} fill={theme.colors.accent} size={34} />
          </View>
          <View style={styles.price}>
            <AppText variant="heading" color={theme.colors.primaryForeground}>
              999
            </AppText>
            <AppText variant="eyebrow" color={theme.colors.accent}>
              AED / mo
            </AppText>
          </View>
        </View>
        {["Elite minisite for your business", "Unlimited price reveals", "Priority search listing", "Stronger trust profile"].map((item) => (
          <View key={item} style={styles.benefit}>
            <CheckCircle2 color={theme.colors.accent} fill={theme.colors.accent} size={19} />
            <AppText color={theme.colors.primaryForeground} style={styles.benefitText}>
              {item}
            </AppText>
          </View>
        ))}
        <Button label="Upgrade now" tone="accent" />
      </Card>
      <View style={styles.planList}>
        {plans.slice(0, 4).map((plan, index) => (
          <Card key={plan.name} muted style={styles.planRow}>
            <View>
              <AppText variant="label">{plan.name}</AppText>
              <AppText variant="eyebrow">{plan.badge}</AppText>
            </View>
            <View style={styles.planRight}>
              <AppText variant="label">{plan.price}</AppText>
              <AppText variant="eyebrow">{plan.reveals} reveals</AppText>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    gap: 4,
    marginBottom: 24,
  },
  elite: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    gap: 18,
    marginBottom: 16,
    padding: 28,
  },
  eliteTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  crown: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 18,
    height: 62,
    justifyContent: "center",
    width: 62,
  },
  price: {
    alignItems: "flex-end",
  },
  benefit: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  benefitText: {
    fontFamily: theme.fonts.sansBold,
  },
  planList: {
    gap: 10,
  },
  planRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  planRight: {
    alignItems: "flex-end",
  },
});
