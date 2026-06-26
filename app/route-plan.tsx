import { useEffect, useMemo, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { MapPinned, Navigation } from "lucide-react-native";
import { AppText } from "@/src/components/ui/AppText";
import { BackHeader } from "@/src/components/ui/BackHeader";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { optimizeProviderRoute } from "@/src/integrations/graphhopper";
import { useAppState } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

type RouteStop = {
  id: string;
  label: string;
  area: string;
};

export default function RoutePlanScreen() {
  const { state } = useAppState();
  const [provider, setProvider] = useState("local-fallback");
  const [stops, setStops] = useState<RouteStop[]>([]);
  const active = useMemo(() => state.activeJobs.filter((job) => !job.completed), [state.activeJobs]);

  useEffect(() => {
    optimizeProviderRoute(active.map((job) => ({ id: job.id, label: job.title, area: job.area }))).then((result) => {
      setProvider(result.provider);
      setStops(result.stops);
    });
  }, [active]);

  return (
    <Screen>
      <BackHeader />
      <View style={styles.header}>
        <AppText variant="heading">Route plan</AppText>
        <AppText color={theme.colors.mutedForeground}>
          Work order for the day. Uses GraphHopper when the API key is configured, with local fallback while developing.
        </AppText>
      </View>
      <Card style={styles.provider}>
        <MapPinned color={theme.colors.accent} size={26} />
        <View>
          <AppText variant="eyebrow">Route engine</AppText>
          <AppText variant="label">{provider === "graphhopper" ? "GraphHopper optimized" : "Local fallback order"}</AppText>
        </View>
      </Card>
      <View style={styles.list}>
        {stops.map((stop, index) => (
          <Card key={stop.id} muted style={styles.stop}>
            <View style={styles.number}>
              <AppText variant="label" color={theme.colors.primaryForeground}>
                {index + 1}
              </AppText>
            </View>
            <View style={styles.stopCopy}>
              <AppText variant="label">{stop.label}</AppText>
              <AppText variant="eyebrow">{stop.area}</AppText>
            </View>
            <Button
              label="Map"
              style={styles.mapButton}
              onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.area)}`)}
            />
          </Card>
        ))}
      </View>
      <Button
        label="Open first stop"
        tone="accent"
        onPress={() => {
          const first = stops[0];
          if (first) Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(first.area)}`);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
    marginBottom: 18,
  },
  provider: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  list: {
    gap: 12,
    marginBottom: 18,
  },
  stop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  number: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  stopCopy: {
    flex: 1,
    gap: 2,
  },
  mapButton: {
    height: 46,
    width: 82,
  },
});
