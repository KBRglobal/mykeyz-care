import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { CheckCircle2, Crown } from "lucide-react-native";
import { AppText } from "@/src/components/ui/AppText";
import { BackHeader } from "@/src/components/ui/BackHeader";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { theme } from "@/src/theme/tokens";
import { useAppState } from "@/src/state/AppState";
import { getPlans, type SubscriptionPlan } from "@/src/services/api";

// Maps a server plan tier to its store product id. Free tiers have no purchase.
const PLAN_PRODUCT_ID: Record<string, string> = {
  standard: "care_plan_standard",
  premium: "care_plan_premium",
};

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function PlansScreen() {
  const { state, purchaseProduct } = useAppState();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Catalog is SERVER TRUTH — never hardcode prices/reveals/tiers on the client.
  useEffect(() => {
    getPlans()
      .then((result) => setPlans(result.data.filter((plan) => plan.active)))
      .catch(() => setError("Could not load plans. Pull to retry."));
  }, []);

  // Current tier comes straight from the server entitlement, never client-decided.
  const currentTier = state.entitlement?.plan ?? null;

  const onPurchase = useCallback(
    async (productId: string) => {
      if (pending) return;
      setPending(productId);
      setError(null);
      // Store IAP -> server validate -> entitlement refetched inside AppState.
      const result = await purchaseProduct(productId);
      setPending(null);
      if (!result.ok) {
        setError(result.error === "already_processed" ? "This purchase was already applied." : "Purchase could not be completed.");
      }
    },
    [pending, purchaseProduct],
  );

  return (
    <Screen>
      <BackHeader />
      <View style={styles.title}>
        <AppText variant="eyebrow" align="center">
          Upgrade your business
        </AppText>
        <AppText variant="heading" align="center">
          Choose your plan
        </AppText>
      </View>
      {error ? (
        <AppText color={theme.colors.destructive} align="center" style={styles.error}>
          {error}
        </AppText>
      ) : null}
      <View style={styles.planList}>
        {plans.map((plan) => {
          const isCurrent = currentTier === plan.tier;
          const productId = PLAN_PRODUCT_ID[plan.tier] ?? null;
          const isBusy = pending === productId;
          return (
            <Card key={plan.tier} style={[styles.planCard, isCurrent && styles.planCardCurrent]}>
              <View style={styles.planHead}>
                <View style={styles.planName}>
                  <Crown
                    color={isCurrent ? theme.colors.accent : theme.colors.mutedForeground}
                    fill={isCurrent ? theme.colors.accent : "transparent"}
                    size={22}
                  />
                  <AppText variant="title" color={isCurrent ? theme.colors.primaryForeground : undefined}>
                    {titleCase(plan.tier)}
                  </AppText>
                </View>
                <View style={styles.priceBox}>
                  <AppText variant="label" color={isCurrent ? theme.colors.primaryForeground : undefined}>
                    {plan.price_aed === 0 ? "Free" : `${plan.price_aed} AED`}
                  </AppText>
                  {plan.price_aed > 0 ? (
                    <AppText variant="eyebrow" color={isCurrent ? theme.colors.accent : theme.colors.mutedForeground}>
                      / mo
                    </AppText>
                  ) : null}
                </View>
              </View>
              <View style={styles.benefit}>
                <CheckCircle2 color={theme.colors.accent} fill={theme.colors.accent} size={18} />
                <AppText color={isCurrent ? theme.colors.primaryForeground : undefined}>
                  {plan.included_reveals} reveal {plan.included_reveals === 1 ? "credit" : "credits"} included
                </AppText>
              </View>
              {isCurrent ? (
                <View style={styles.currentBadge}>
                  <AppText variant="eyebrow" color={theme.colors.accent}>
                    Current plan
                  </AppText>
                </View>
              ) : productId ? (
                <Button
                  label={isBusy ? "Working…" : `Upgrade to ${titleCase(plan.tier)}`}
                  tone="accent"
                  onPress={() => onPurchase(productId)}
                />
              ) : null}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    gap: 4,
    marginBottom: 24,
  },
  error: {
    marginBottom: 12,
  },
  planList: {
    gap: 12,
  },
  planCard: {
    gap: 14,
    padding: 20,
  },
  planCardCurrent: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  planHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  planName: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  priceBox: {
    alignItems: "flex-end",
  },
  benefit: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  currentBadge: {
    alignItems: "center",
  },
});
