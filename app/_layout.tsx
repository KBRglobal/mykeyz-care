import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { JetBrainsMono_700Bold } from "@expo-google-fonts/jetbrains-mono";
import { Montserrat_800ExtraBold, Montserrat_900Black } from "@expo-google-fonts/montserrat";
import { useFonts } from "expo-font";
import { DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import "react-native-reanimated";
import { i18n } from "@/src/i18n";
import { AppStateProvider } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(auth)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Montserrat_800ExtraBold,
    Montserrat_900Black,
    JetBrainsMono_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider
        value={{
          ...DefaultTheme,
          dark: false,
          colors: {
            ...DefaultTheme.colors,
            primary: theme.colors.primary,
            background: theme.colors.background,
            card: theme.colors.surface,
            text: theme.colors.foreground,
            border: theme.colors.border,
            notification: theme.colors.accent,
          },
        }}
      >
        <AppStateProvider>
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(setup)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="job/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="quote/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="quote-success" options={{ headerShown: false }} />
            <Stack.Screen name="reveal/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="plans" options={{ headerShown: false }} />
            <Stack.Screen name="earnings" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="credits" options={{ headerShown: false }} />
            <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
            <Stack.Screen name="job-complete" options={{ headerShown: false }} />
            <Stack.Screen name="profile-preview" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: "modal" }} />
          </Stack>
        </AppStateProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
