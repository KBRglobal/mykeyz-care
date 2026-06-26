import { View, StyleSheet } from "react-native";
import { AppText } from "@/src/components/ui/AppText";
import { theme } from "@/src/theme/tokens";

export function BrandMark() {
  return (
    <View style={styles.row}>
      <View style={styles.word}>
        <AppText style={styles.logo}>MYKEYZ</AppText>
        <View style={styles.dot} />
      </View>
      <AppText style={styles.care}>care</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  word: {
    alignItems: "flex-end",
    flexDirection: "row",
  },
  logo: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.heading,
    fontSize: 14,
    lineHeight: 16,
  },
  dot: {
    backgroundColor: theme.colors.accent,
    height: 6,
    marginBottom: 2,
    marginLeft: 2,
    width: 6,
  },
  care: {
    color: "#CBD5E1",
    fontFamily: theme.fonts.sansBold,
    fontSize: 11,
    lineHeight: 13,
  },
});
