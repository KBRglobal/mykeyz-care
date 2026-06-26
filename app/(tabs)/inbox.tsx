import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AppText } from "@/src/components/ui/AppText";
import { Card } from "@/src/components/ui/Card";
import { Header } from "@/src/components/ui/Header";
import { Screen } from "@/src/components/ui/Screen";
import { useAppState } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

export default function InboxScreen() {
  const { t } = useTranslation();
  const { state } = useAppState();

  return (
    <Screen>
      <Header title={t("messages")} />
      <View style={styles.list}>
        {state.conversations.map((item) => (
          <Pressable key={item.id} onPress={() => router.push(`/chat/${item.id}`)}>
            <Card muted style={styles.row}>
              <View style={styles.avatar}>
                <AppText variant="label" color={theme.colors.primaryForeground}>
                  {item.name.slice(0, 2).toUpperCase()}
                </AppText>
              </View>
              <View style={styles.copy}>
                <AppText variant="label">{item.name}</AppText>
                <AppText color={theme.colors.mutedForeground}>{item.preview}</AppText>
                <AppText variant="eyebrow">{item.job}</AppText>
              </View>
              {item.unread ? (
                <View style={styles.unread}>
                  <AppText variant="label" color={theme.colors.primaryForeground}>
                    {item.unread}
                  </AppText>
                </View>
              ) : null}
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 14,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    padding: 16,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  unread: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.full,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
});
