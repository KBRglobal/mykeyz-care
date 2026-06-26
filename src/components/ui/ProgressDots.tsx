import { StyleSheet, View } from "react-native";
import { theme } from "@/src/theme/tokens";

export function ProgressDots({ index, total }: { index: number; total: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, item) => (
        <View key={item} style={[styles.dot, item === index ? styles.active : null]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    backgroundColor: theme.colors.mutedStrong,
    borderRadius: theme.radius.full,
    height: 4,
    width: 10,
  },
  active: {
    backgroundColor: theme.colors.primary,
    width: 34,
  },
});
