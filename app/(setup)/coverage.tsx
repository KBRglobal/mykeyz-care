import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Check, Globe, MapPin } from "lucide-react-native";
import { BackHeader } from "@/src/components/ui/BackHeader";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { SetupProgress } from "@/src/components/product/SetupProgress";
import { serviceAreas } from "@/src/data/catalog";
import { useAppState } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

export default function CoverageScreen() {
  const { state, toggleArea, saveAreas, setCoversAllDubai } = useAppState();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const allDubai = state.coversAllDubai;

  const onContinue = async () => {
    if (saving) return;
    setError("");
    if (!allDubai && state.selectedAreas.length === 0) {
      setError("Select at least one area, or choose All Dubai.");
      return;
    }
    setSaving(true);
    try {
      await saveAreas();
      router.push("/(setup)/business");
    } catch {
      setError("Could not save your coverage areas. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <BackHeader />
      <SetupProgress active={1} />
      <View style={styles.header}>
        <AppText variant="heading">Coverage Area</AppText>
        <AppText color={theme.colors.mutedForeground}>
          Most jobs are quote-based, so you can cover all of Dubai — or pick specific areas.
        </AppText>
      </View>
      <View style={styles.modes}>
        <Pressable style={styles.modeWrap} onPress={() => setCoversAllDubai(true)}>
          <Card muted={!allDubai} style={[styles.mode, allDubai ? styles.selected : null]}>
            <Globe color={allDubai ? theme.colors.accent : theme.colors.mutedForeground} size={20} />
            <AppText variant="label" color={allDubai ? theme.colors.primaryForeground : theme.colors.foreground}>
              All Dubai
            </AppText>
          </Card>
        </Pressable>
        <Pressable style={styles.modeWrap} onPress={() => setCoversAllDubai(false)}>
          <Card muted={allDubai} style={[styles.mode, !allDubai ? styles.selected : null]}>
            <MapPin color={!allDubai ? theme.colors.accent : theme.colors.mutedForeground} size={20} />
            <AppText variant="label" color={!allDubai ? theme.colors.primaryForeground : theme.colors.foreground}>
              Specific areas
            </AppText>
          </Card>
        </Pressable>
      </View>
      {allDubai ? (
        <Card muted style={styles.allNote}>
          <AppText color={theme.colors.mutedForeground}>
            You'll receive matching jobs from anywhere in Dubai.
          </AppText>
        </Card>
      ) : (
        <View style={styles.list}>
          {serviceAreas.map((area) => {
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
      )}
      {error ? <AppText color={theme.colors.destructive} style={styles.error}>{error}</AppText> : null}
      <Button
        label={saving ? "Saving..." : allDubai ? "Continue • All Dubai" : `Continue • ${state.selectedAreas.length} areas`}
        onPress={onContinue}
        style={styles.cta}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
    marginBottom: 22,
  },
  modes: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  modeWrap: {
    flex: 1,
  },
  mode: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    padding: 18,
  },
  allNote: {
    padding: 18,
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
  error: {
    marginTop: 16,
  },
  cta: {
    marginTop: 26,
  },
});
