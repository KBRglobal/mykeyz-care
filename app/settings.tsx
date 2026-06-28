import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Bell, Building2, CalendarClock, ChevronRight, Languages, LogOut, MapPin, SlidersHorizontal, TrendingUp, User } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { AppText } from "@/src/components/ui/AppText";
import { BackHeader } from "@/src/components/ui/BackHeader";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { supportedLanguages } from "@/src/i18n";
import { useAppState } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

const VERIFICATION_LABEL: Record<string, string> = {
  approved: "Verified partner",
  submitted: "Pending review",
  needs_changes: "Needs changes",
  rejected: "Not approved",
  suspended: "Suspended",
  draft: "Not verified yet",
};

export default function SettingsScreen() {
  const { i18n } = useTranslation();
  const { state, resetApp, toggleSimpleMode, logout, setLanguage } = useAppState();
  const { provider } = state;

  // All meta values are derived from real state — never hardcoded.
  const initials = provider.name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const isApproved = state.verificationStatus === "approved";
  const areasMeta = state.coversAllDubai
    ? "All Dubai"
    : state.selectedAreas.length
      ? `${state.selectedAreas.length} area${state.selectedAreas.length > 1 ? "s" : ""}`
      : "Not set";
  const langMeta = supportedLanguages.find((l) => l.code === i18n.language)?.label ?? "English";

  const cycleLanguage = () => {
    const current = supportedLanguages.findIndex((l) => l.code === i18n.language);
    const next = supportedLanguages[(current + 1) % supportedLanguages.length];
    i18n.changeLanguage(next.code);
    setLanguage(next.code);
  };

  const rows = [
    { label: "Trade License", icon: Building2, meta: state.tradeLicenseNumber || "Not set", onPress: () => router.push("/(setup)/license") },
    { label: "Service Areas", icon: MapPin, meta: areasMeta, onPress: () => router.push("/(setup)/coverage") },
    { label: "Availability", icon: CalendarClock, meta: "Calendar", onPress: () => router.push("/availability") },
    { label: "Performance", icon: TrendingUp, meta: "Weekly", onPress: () => router.push("/performance") },
    { label: "Language", icon: Languages, meta: langMeta, onPress: cycleLanguage },
    { label: "Notifications", icon: Bell, meta: "", onPress: () => router.push("/notifications") },
  ] as const;

  return (
    <Screen>
      <BackHeader />
      <View style={styles.profile}>
        <View style={styles.avatar}>
          {initials ? (
            <AppText variant="title" color={theme.colors.primaryForeground}>
              {initials}
            </AppText>
          ) : (
            <User color={theme.colors.primaryForeground} size={26} />
          )}
        </View>
        <View>
          <AppText variant="title">{provider.name || "Your profile"}</AppText>
          <View style={styles.badge}>
            <AppText variant="eyebrow" color={isApproved ? theme.colors.success : theme.colors.mutedForeground}>
              {VERIFICATION_LABEL[state.verificationStatus] ?? "Not verified yet"}
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
            <Pressable key={row.label} onPress={row.onPress}>
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
