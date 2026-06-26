import { StyleSheet, View } from "react-native";
import { CheckCircle2, Eye, Zap } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { AppText } from "@/src/components/ui/AppText";
import { BackHeader } from "@/src/components/ui/BackHeader";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { useAppState } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

export default function NotificationsScreen() {
  const { state } = useAppState();
  const { t } = useTranslation();
  // Render every notification in the supplier's preferred language held in state.
  const lng = state.language;
  const notifications = [
    state.sentQuotes[0]
      ? {
          id: `quote-${state.sentQuotes[0].id}`,
          title: t("notifQuoteSentTitle", { lng }),
          body: t("notifQuoteSentBody", { amount: state.sentQuotes[0].amount, lng }),
        }
      : null,
    state.jobs[0]
      ? {
          id: `job-${state.jobs[0].id}`,
          title: t("notifNewOppTitle", { lng }),
          body: t("notifNewOppBody", { title: state.jobs[0].title, area: state.jobs[0].area, lng }),
        }
      : null,
    state.conversations[0]
      ? {
          id: `chat-${state.conversations[0].id}`,
          title: t("notifCustomerMsgTitle", { lng }),
          // The preview is already translated server-side into the recipient language.
          body: state.conversations[0].preview,
        }
      : null,
  ].filter(Boolean) as { id: string; title: string; body: string }[];

  return (
    <Screen>
      <BackHeader />
      <View style={styles.head}>
        <AppText variant="heading">{t("notifTitle", { lng })}</AppText>
        <AppText variant="eyebrow" color={theme.colors.info}>
          {t("notifMarkAllRead", { lng })}
        </AppText>
      </View>
      <AppText variant="eyebrow" style={styles.section}>
        {t("notifToday", { lng })}
      </AppText>
      <View style={styles.list}>
        {notifications.map((item, index) => {
          const Icon = index === 0 ? CheckCircle2 : index === 1 ? Zap : Eye;
          const color = index === 0 ? theme.colors.success : index === 1 ? theme.colors.info : theme.colors.accent;
          return (
            <Card key={item.id} style={[styles.row, index === 0 ? styles.highlight : null]}>
              <View style={[styles.icon, { backgroundColor: `${color}18` }]}>
                <Icon color={color} fill={index === 0 ? color : "transparent"} size={26} />
              </View>
              <View style={styles.copy}>
                <View style={styles.rowTop}>
                  <AppText variant="label">{item.title}</AppText>
                  <AppText variant="eyebrow">{index === 0 ? t("notifNow", { lng }) : `${index * 12}m`}</AppText>
                </View>
                <AppText color={theme.colors.foregroundSoft}>{item.body}</AppText>
              </View>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 12,
  },
  list: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 14,
    padding: 16,
  },
  highlight: {
    borderColor: theme.colors.success,
    borderWidth: 2,
  },
  icon: {
    alignItems: "center",
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
});
