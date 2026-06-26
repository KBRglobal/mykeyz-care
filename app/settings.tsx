import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Bell, Building2, CalendarClock, ChevronRight, CreditCard, Languages, LogOut, MapPin, SlidersHorizontal, TrendingUp } from "lucide-react-native";
import { AppText } from "@/src/components/ui/AppText";
import { BackHeader } from "@/src/components/ui/BackHeader";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { useAppState } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

const rows = [
  { label: "Trade License", icon: Building2, route: "/(setup)/license", meta: "" },
  { label: "Service Areas", icon: MapPin, route: "/(setup)/coverage", meta: "6 areas" },
  { label: "Availability", icon: CalendarClock, route: "/availability", meta: "Calendar" },
  { label: "Performance", icon: TrendingUp, route: "/performance", meta: "Weekly" },
  { label: "Language", icon: Languages, route: "/(setup)/phone", meta: "English" },
  { label: "Push Alerts", icon: Bell, route: "/notifications", meta: "On" },
  { label: "Bank Details", icon: CreditCard, route: "/(setup)/bank", meta: "" },
] as const;

export default function SettingsScreen() {
  const { state, resetApp, toggleSimpleMode, logout } = useAppState();
  const { provider } = state;

  return (
    <Screen>
      <BackHeader />
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <AppText variant="title" color={theme.colors.primaryForeground}>
            AR
          </AppText>
        </View>
        <View>
          <AppText variant="title">{provider.name}</AppText>
          <View style={styles.badge}>
            <AppText variant="eyebrow" color={theme.colors.success}>
              Verified partner
            </AppText>
          </View>
        </View>
      </View>
      <View style={styles.groups}>
        <Pressable onPress={toggleSimpleMode}>
          <Card muted style={styles.row}>
            <View style={styles.left}>
              <View style={styles.icon}>
                <SlidersHorizontal color={theme.colors.primary} size={22} />
              </View>
              <AppText variant="label">Simple Mode</AppText>
            </View>
            <View style={[styles.switch, state.simpleMode ? styles.switchOn : null]}>
              <View style={[styles.knob, state.simpleMode ? styles.knobOn : null]} />
            </View>
          </Card>
        </Pressable>
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <Pressable key={row.label} onPress={() => router.push(row.route)}>
              <Card muted style={styles.row}>
                <View style={styles.left}>
                  <View style={styles.icon}>
                    <Icon color={theme.colors.primary} size={22} />
                  </View>
                  <AppText variant="label">{row.label}</AppText>
                </View>
                <View style={styles.right}>
                  {row.meta ? <AppText variant="eyebrow">{row.meta}</AppText> : null}
                  <ChevronRight color={theme.colors.mutedForeground} size={18} />
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        onPress={async () => {
          await logout();
          router.replace("/(auth)");
        }}
      >
        <Card muted style={styles.logout}>
          <LogOut color={theme.colors.destructive} size={21} />
          <AppText variant="label" color={theme.colors.destructive}>
            Log out
          </AppText>
        </Card>
      </Pressable>
      <Pressable
        onPress={() => {
          resetApp();
          router.replace("/(auth)");
        }}
      >
        <Card muted style={styles.reset}>
          <AppText variant="label" color={theme.colors.destructive}>
            Reset local app state
          </AppText>
        </Card>
      </Pressable>
      <AppText variant="eyebrow" align="center" style={styles.version}>
        MyKeyz Partner v0.1
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    marginBottom: 30,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: 24,
    height: 78,
    justifyContent: "center",
    width: 78,
  },
  badge: {
    backgroundColor: "#ECFDF5",
    borderRadius: theme.radius.full,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  groups: {
    gap: 10,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
  },
  left: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  icon: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  right: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  switch: {
    backgroundColor: theme.colors.mutedStrong,
    borderRadius: theme.radius.full,
    height: 30,
    justifyContent: "center",
    paddingHorizontal: 3,
    width: 54,
  },
  switchOn: {
    backgroundColor: theme.colors.primary,
  },
  knob: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    height: 24,
    width: 24,
  },
  knobOn: {
    alignSelf: "flex-end",
  },
  logout: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginTop: 30,
  },
  reset: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  version: {
    marginTop: 26,
  },
});
