import { StyleSheet, View } from "react-native";
import { BadgeCheck, Crown, Star } from "lucide-react-native";
import { AppText } from "@/src/components/ui/AppText";
import { BackHeader } from "@/src/components/ui/BackHeader";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { useAppState } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

export default function ProfilePreviewScreen() {
  const { state } = useAppState();
  const initials = state.provider.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Screen>
      <BackHeader />
      <View style={styles.title}>
        <AppText variant="heading" align="center">
          Your Public Profile
        </AppText>
        <AppText variant="eyebrow" color={theme.colors.info} align="center">
          Preview mode active
        </AppText>
      </View>
      <View style={styles.sectionHeader}>
        <AppText variant="eyebrow">Current view</AppText>
        <AppText variant="eyebrow" color={theme.colors.info}>
          Active
        </AppText>
      </View>
      <Card style={styles.current}>
        <View style={styles.avatarSmall}>
          <AppText variant="title" color={theme.colors.primaryForeground}>
            {initials}
          </AppText>
        </View>
        <View>
          <AppText variant="title" style={styles.name}>
            {state.provider.name}
          </AppText>
          <View style={styles.verifiedRow}>
            <BadgeCheck color={theme.colors.info} fill={theme.colors.info} size={16} />
            <AppText variant="eyebrow">Verified Expert</AppText>
          </View>
        </View>
      </Card>
      <View style={styles.upgradePill}>
        <AppText variant="eyebrow" color={theme.colors.primary}>
          Upgrade to Elite Partner
        </AppText>
      </View>
      <Card style={styles.elite}>
        <View style={styles.eliteTop}>
          <View style={styles.avatarElite}>
            <AppText variant="heading" color={theme.colors.primaryForeground}>
              {initials}
            </AppText>
            <View style={styles.crown}>
              <Crown color={theme.colors.primary} fill={theme.colors.accent} size={20} />
            </View>
          </View>
          <View style={styles.eliteCopy}>
            <AppText variant="title" color={theme.colors.primaryForeground}>
              {state.provider.name}
            </AppText>
            <View style={styles.badges}>
              <AppText style={styles.badge}>Top Rated</AppText>
              <AppText style={styles.badgeBlue}>{state.provider.services[0] ?? "Provider"}</AppText>
            </View>
          </View>
        </View>
        <View style={styles.gallery}>
          <View style={styles.projectTile} />
          <View style={styles.projectTile} />
          <View style={styles.moreTile}>
            <AppText variant="title" color={theme.colors.accent}>
              +{Math.max(0, state.profileGallery.length)}
            </AppText>
            <AppText variant="eyebrow">Projects</AppText>
          </View>
        </View>
      </Card>
      <Card style={styles.review}>
        <View style={styles.reviewHead}>
          <AppText variant="label">Recent reviews</AppText>
          <View style={styles.stars}>
            <Star color={theme.colors.accent} fill={theme.colors.accent} size={16} />
          <AppText variant="label">{state.provider.rating}</AppText>
          </View>
        </View>
        <AppText color={theme.colors.mutedForeground}>
          "Ahmed is professional, fast and clean. I would hire him again."
        </AppText>
      </Card>
      <Button label="Upgrade to elite now" style={styles.cta} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    gap: 4,
    marginBottom: 26,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  current: {
    alignItems: "center",
    borderColor: theme.colors.primary,
    borderWidth: 2,
    flexDirection: "row",
    gap: 14,
    marginBottom: 24,
  },
  avatarSmall: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  name: {
    fontSize: 20,
  },
  verifiedRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  upgradePill: {
    alignSelf: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.full,
    marginBottom: -14,
    paddingHorizontal: 18,
    paddingVertical: 8,
    zIndex: 2,
  },
  elite: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.accent,
    borderWidth: 4,
    gap: 22,
    marginBottom: 16,
    paddingTop: 34,
  },
  eliteTop: {
    flexDirection: "row",
    gap: 16,
  },
  avatarElite: {
    alignItems: "center",
    backgroundColor: "#102A52",
    borderColor: theme.colors.accent,
    borderRadius: 22,
    borderWidth: 3,
    height: 84,
    justifyContent: "center",
    width: 84,
  },
  crown: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.full,
    bottom: -8,
    height: 34,
    justifyContent: "center",
    position: "absolute",
    right: -8,
    width: 34,
  },
  eliteCopy: {
    flex: 1,
    gap: 8,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    backgroundColor: "rgba(227,179,65,0.18)",
    borderRadius: 4,
    color: theme.colors.accent,
    fontFamily: theme.fonts.sansBold,
    fontSize: 8,
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 4,
    textTransform: "uppercase",
  },
  badgeBlue: {
    backgroundColor: "rgba(37,99,235,0.2)",
    borderRadius: 4,
    color: "#93C5FD",
    fontFamily: theme.fonts.sansBold,
    fontSize: 8,
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 4,
    textTransform: "uppercase",
  },
  gallery: {
    flexDirection: "row",
    gap: 10,
  },
  projectTile: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    flex: 1,
    height: 78,
  },
  moreTile: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    flex: 1,
    height: 78,
    justifyContent: "center",
  },
  review: {
    gap: 12,
  },
  reviewHead: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stars: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  cta: {
    marginTop: 18,
  },
});
