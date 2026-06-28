import { router } from "expo-router";
import { Image, Pressable, StyleSheet, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { BadgeCheck, Camera, Clock3, Pencil } from "lucide-react-native";
import { FormField } from "@/src/components/forms/FormField";
import { AppText } from "@/src/components/ui/AppText";
import { BackHeader } from "@/src/components/ui/BackHeader";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { useAppState } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

export default function EditProfileScreen() {
  const { state, addGalleryImage, updateBusiness } = useAppState();
  const initials = state.provider.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function pickWorkPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.82,
    });
    if (!result.canceled) addGalleryImage(result.assets[0].uri);
  }

  return (
    <Screen>
      <View style={styles.top}>
        <BackHeader />
        <AppText variant="eyebrow" color={theme.colors.accent} onPress={() => router.back()}>
          Done
        </AppText>
      </View>
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <AppText variant="heading" color={theme.colors.primaryForeground}>
            {initials}
          </AppText>
          <View style={styles.pencil}>
            <Pencil color={theme.colors.primaryForeground} size={18} />
          </View>
        </View>
        <AppText variant="eyebrow">{state.provider.name} • {state.provider.services[0] ?? "Provider"}</AppText>
      </View>
      <View style={styles.fields}>
        <FormField label="Business name" defaultValue={state.businessName} onEndEditing={(event) => updateBusiness(event.nativeEvent.text, state.tradeLicenseNumber)} />
        <View style={styles.areaBlock}>
          <AppText variant="eyebrow">Coverage areas</AppText>
          <View style={styles.chips}>
            {state.coversAllDubai ? (
              <View style={styles.chip}>
                <AppText variant="eyebrow" color={theme.colors.primaryForeground}>
                  All Dubai
                </AppText>
              </View>
            ) : (
              state.selectedAreas.map((area) => (
                <View key={area} style={styles.chip}>
                  <AppText variant="eyebrow" color={theme.colors.primaryForeground}>
                    {area}
                  </AppText>
                </View>
              ))
            )}
            <Pressable style={styles.addChip} onPress={() => router.push("/(setup)/coverage")}>
              <AppText variant="eyebrow">Edit areas</AppText>
            </Pressable>
          </View>
        </View>
        <View style={styles.areaBlock}>
          <View style={styles.blockHeader}>
            <AppText variant="eyebrow">Before / After gallery</AppText>
            <Pressable style={styles.addPhoto} onPress={pickWorkPhoto}>
              <Camera color={theme.colors.primary} size={16} />
              <AppText variant="eyebrow" color={theme.colors.primary}>
                Add
              </AppText>
            </Pressable>
          </View>
          <View style={styles.gallery}>
            {state.profileGallery.length ? (
              state.profileGallery.slice(0, 4).map((uri) => <Image key={uri} source={{ uri }} style={styles.workPhoto} />)
            ) : (
              <Card muted style={styles.emptyGallery}>
                <Camera color={theme.colors.accent} size={24} />
                <AppText color={theme.colors.mutedForeground}>
                  Add real job photos. Customers trust visible work more than badges.
                </AppText>
              </Card>
            )}
          </View>
        </View>
        <View style={styles.areaBlock}>
          <AppText variant="eyebrow">Verification status</AppText>
          {state.verificationStatus === "approved" ? (
            <Card muted style={styles.verified}>
              <BadgeCheck color={theme.colors.success} fill={theme.colors.success} size={30} />
              <View>
                <AppText variant="label" color="#064E3B">
                  Verified partner
                </AppText>
                <AppText variant="eyebrow" color="#047857">
                  License {state.tradeLicenseNumber || "on file"} approved
                </AppText>
              </View>
            </Card>
          ) : (
            <Pressable onPress={() => router.push("/(setup)/license")}>
              <Card muted style={styles.pending}>
                <Clock3 color={theme.colors.mutedForeground} size={28} />
                <View>
                  <AppText variant="label">
                    {state.verificationStatus === "submitted" ? "Pending review" : "Not verified yet"}
                  </AppText>
                  <AppText variant="eyebrow" color={theme.colors.mutedForeground}>
                    {state.verificationStatus === "submitted"
                      ? "We'll let you know once your license is reviewed."
                      : "Add your trade license to get verified."}
                  </AppText>
                </View>
              </Card>
            </Pressable>
          )}
        </View>
      </View>
      <Button label="Done" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    marginBottom: 8,
  },
  identity: {
    alignItems: "center",
    gap: 14,
    marginBottom: 32,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.xl,
    height: 126,
    justifyContent: "center",
    width: 126,
  },
  pencil: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.surface,
    borderRadius: 13,
    borderWidth: 4,
    bottom: -8,
    height: 42,
    justifyContent: "center",
    position: "absolute",
    right: -8,
    width: 42,
  },
  fields: {
    gap: 22,
    marginBottom: 26,
  },
  areaBlock: {
    gap: 10,
  },
  blockHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  addPhoto: {
    alignItems: "center",
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.full,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  gallery: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  workPhoto: {
    backgroundColor: theme.colors.mutedStrong,
    borderRadius: 18,
    height: 92,
    width: "47%",
  },
  emptyGallery: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  addChip: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
    borderStyle: "dashed",
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  verified: {
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderColor: "#D1FAE5",
    flexDirection: "row",
    gap: 12,
  },
  pending: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
});
