import { StyleSheet, View } from "react-native";
import { AppText } from "@/src/components/ui/AppText";
import { setupSteps } from "@/src/data/catalog";
import { theme } from "@/src/theme/tokens";

export function SetupProgress({ active }: { active: number }) {
  return (
    <View style={styles.wrap}>
      {setupSteps.map((step, index) => {
        const Icon = step.icon;
        const isActive = index <= active;
        return (
          <View key={step.key} style={styles.step}>
            <View style={[styles.dot, isActive ? styles.active : null]}>
              <Icon
                color={isActive ? theme.colors.primaryForeground : theme.colors.mutedForeground}
                size={13}
              />
            </View>
            <AppText variant="eyebrow" style={styles.label}>
              {step.label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  step: {
    alignItems: "center",
    flex: 1,
    gap: 5,
  },
  dot: {
    alignItems: "center",
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.full,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  active: {
    backgroundColor: theme.colors.primary,
  },
  label: {
    fontSize: 7,
  },
});
