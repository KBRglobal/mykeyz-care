import { SafeAreaView } from "react-native-safe-area-context";
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { theme } from "@/src/theme/tokens";

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Screen({ children, scroll = true, style, contentStyle }: ScreenProps) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.max(280, Math.min(width - theme.spacing.pageX * 2, 382));
  const content = (
    <View style={[styles.content, { width: contentWidth }, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.root, style]}>
      {scroll ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: theme.colors.background,
    flex: 1,
    overflow: "hidden",
  },
  scroll: {
    alignItems: "center",
    paddingBottom: 28,
  },
  content: {
    alignSelf: "center",
    flexGrow: 1,
    maxWidth: "100%",
    paddingTop: theme.spacing.pageTop,
  },
});
