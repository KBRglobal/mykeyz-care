import { Tabs } from "expo-router";
import { BriefcaseBusiness, Home, MessageCircle, User, Zap } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { theme } from "@/src/theme/tokens";

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: "#C9D3DF",
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: "#EEF2F7",
          height: 88,
          paddingBottom: 18,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontFamily: theme.fonts.sansBold,
          fontSize: 10,
          textTransform: "uppercase",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("home"),
          tabBarIcon: ({ color, focused }) => (
            <Home color={color} fill={focused ? color : "transparent"} size={25} />
          ),
        }}
      />
      <Tabs.Screen
        name="quotes"
        options={{
          title: t("quotes"),
          tabBarIcon: ({ color, focused }) => (
            <Zap color={color} fill={focused ? color : "transparent"} size={25} />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: t("jobs"),
          tabBarIcon: ({ color, focused }) => (
            <BriefcaseBusiness color={color} fill={focused ? color : "transparent"} size={25} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: t("inbox"),
          tabBarIcon: ({ color, focused }) => (
            <MessageCircle color={color} fill={focused ? color : "transparent"} size={25} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile"),
          tabBarIcon: ({ color, focused }) => (
            <User color={color} fill={focused ? color : "transparent"} size={25} />
          ),
        }}
      />
    </Tabs>
  );
}
