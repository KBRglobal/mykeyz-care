import { Pressable, StyleSheet, View } from "react-native";
import * as Speech from "expo-speech";
import { Volume2 } from "lucide-react-native";
import { AppText } from "@/src/components/ui/AppText";
import { theme } from "@/src/theme/tokens";

type VoiceHelpProps = {
  text: string;
  label?: string;
};

export function VoiceHelp({ text, label = "Listen" }: VoiceHelpProps) {
  return (
    <Pressable
      onPress={() => Speech.speak(text, { rate: 0.88 })}
      style={({ pressed }) => [styles.wrap, pressed ? styles.pressed : null]}
    >
      <View style={styles.icon}>
        <Volume2 color={theme.colors.primary} size={18} />
      </View>
      <AppText variant="eyebrow" color={theme.colors.primary}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.full,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  icon: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  pressed: {
    opacity: 0.78,
  },
});
