import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TESTMODE_CODE } from "@/src/constants/testmode";

// Thin always-on banner pinned above everything (pointer-events disabled so it never blocks taps).
// Rendered once at the root layout so it sits on top of every screen.
export function TestModeBadge() {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="none" style={[styles.wrap, { paddingTop: insets.top }]}>
      <Text style={styles.text}>testmode - {TESTMODE_CODE}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    backgroundColor: "rgba(15,28,63,0.92)",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 9999,
  },
  text: {
    color: "#E8C875",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    paddingVertical: 2,
    textTransform: "uppercase",
  },
});
