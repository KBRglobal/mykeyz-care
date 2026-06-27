import { Pressable, StyleSheet, View } from "react-native";
import { MapPin } from "lucide-react-native";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { theme } from "@/src/theme/tokens";
import type { ProviderJob } from "@/src/state/AppState";

type Job = ProviderJob;

export function OpportunityCard({ job, onPress }: { job: Job; onPress?: () => void }) {
  const Icon = job.icon;

  return (
    <Card muted style={styles.card}>
      <Pressable onPress={onPress} style={styles.top}>
        <View style={styles.iconBox}>
          <Icon color={theme.colors.accent} size={24} strokeWidth={2.8} />
        </View>
        <View style={styles.copy}>
          <AppText variant="eyebrow">{job.trade}</AppText>
          <AppText variant="title" style={styles.title}>
            {job.title}
          </AppText>
          <View style={styles.meta}>
            <MapPin color={theme.colors.accent} size={13} fill={theme.colors.accent} />
            <AppText variant="eyebrow" style={styles.metaText}>
              {job.area} • {job.home}
            </AppText>
          </View>
        </View>
        <View style={styles.price}>
          <AppText variant="label">AED {job.estimate}</AppText>
          <AppText variant="eyebrow" style={styles.priceHint}>
            est.
          </AppText>
        </View>
      </Pressable>
      <View style={styles.actions}>
        <Button label="Details" tone="secondary" style={styles.button} onPress={onPress} />
        <Button label="Quote" style={styles.button} onPress={onPress} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 20,
  },
  top: {
    flexDirection: "row",
    gap: 14,
  },
  iconBox: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 19,
    lineHeight: 22,
  },
  meta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  metaText: {
    fontSize: 9,
  },
  price: {
    alignItems: "flex-end",
  },
  priceHint: {
    fontSize: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    height: 54,
  },
});
