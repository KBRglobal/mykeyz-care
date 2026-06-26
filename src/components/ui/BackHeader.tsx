import { Pressable, StyleSheet, View } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { router } from "expo-router";
import { BrandMark } from "@/src/components/ui/BrandMark";
import { theme } from "@/src/theme/tokens";

type BackHeaderProps = {
  onBack?: () => void;
};

export function BackHeader({ onBack }: BackHeaderProps) {
  return (
    <View style={styles.wrap}>
      <Pressable style={styles.button} onPress={onBack ?? (() => router.back())}>
        <ArrowLeft color={theme.colors.primary} size={22} strokeWidth={3} />
      </Pressable>
      <BrandMark />
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  button: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  spacer: {
    width: 48,
  },
});
