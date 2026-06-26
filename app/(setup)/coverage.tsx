import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Check, MapPin } from "lucide-react-native";
import { BackHeader } from "@/src/components/ui/BackHeader";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { SetupProgress } from "@/src/components/product/SetupProgress";
import { serviceAreas } from "@/src/data/mock";
import { useAppState } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

export default function CoverageScreen() {
  const { state, toggleArea } = useAppState();

  return (
    <Screen>
      <BackHeader />
      <SetupProgress active={1} />
      <View style={styles.header}>
        <AppText variant="heading">Coverage Area</AppText>
        <AppText color={theme.colors.mutedForeground}>
          Choose where you can accept inspection-based jobs.
        </AppText>
      </View>
      <View style={styles.list}>
        {serviceAreas.map((area, index) => {
          const selected = state.selectedAreas.includes(area);
          return (
            <Pressable key={area} onPress={() => toggleArea(area)}>
              <Card muted={!selected} style={[styles.row, selected ? styles.selected : null]}>
                <View style={styles.rowLeft}>
                  <MapPin color={selected ? theme.colors.accent : theme.colors.mutedForeground} size={18} />
                  <AppText variant="label" color={selected ? theme.colors.primaryForeground : theme.colors.foreground}>
                    {area}
                  </AppText>
                </View>
                {selected ? <Check color={theme.colors.accent} size={20} strokeWidth={3} /> : null}
              </Card>
            </Pressable>
          );
        })}
      </View>
      <Button label={`Continue • ${state.selectedAreas.length} areas`} onPress={() => router.push("/(setup)/business")} style={styles.cta} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
    marginBottom: 22,
  },
  list: {
    gap: 10,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  selected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  rowLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  cta: {
    marginTop: 26,
  },
});
