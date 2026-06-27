import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { JetBrainsMono_700Bold } from "@expo-google-fonts/jetbrains-mono";
import { Montserrat_800ExtraBold, Montserrat_900Black } from "@expo-google-fonts/montserrat";
import Constants from "expo-constants";
import { useFonts } from "expo-font";
import { DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { View } from "react-native";
import "react-native-reanimated";
import { TestModeBadge } from "@/src/components/ui/TestModeBadge";
import { i18n } from "@/src/i18n";
import { AppStateProvider } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(auth)",
};

// Minimal surface of @sentry/react-native we touch. The module is optional and resolved
// indirectly so neither TypeScript nor the bundler statically depends on it.
type SentryModule = {
  init: (options: Record<string, unknown>) => void;
  wrap: <C>(component: C) => C;
};

// Guarded, defensive Sentry bootstrap. When EXPO_PUBLIC_SENTRY_DSN is unset this is a
// complete no-op: no client is created and the native module is never touched. The
// require is wrapped in try/catch so a missing native module can never crash the JS
// bundle (same defensive posture as src/integrations/analytics.ts). No tokens or PII
// are ever passed to Sentry here.
function initSentry(): SentryModule | null {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return null;
  try {
    // Indirect specifier keeps the optional dependency out of the static module graph
    // (TypeScript only resolves a literal `require("…")`, not a variable specifier).
    const moduleName = "@sentry/react-native";
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Sentry = require(moduleName) as SentryModule;
    Sentry.init({
      dsn,
      environment: (Constants.expoConfig?.extra?.environment as string | undefined) ?? "production",
      release: Constants.expoConfig?.version,
    });
    return Sentry;
  } catch {
    return null;
  }
}

const sentry = initSentry();

SplashScreen.preventAutoHideAsync();

function RootLayout() {
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
          <View style={{ flex: 1 }}>
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
          <TestModeBadge />
          </View>
        </AppStateProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

// When Sentry is active, wrap the root so render crashes (and the React tree) are
// captured. With no DSN, `sentry` is null and the unwrapped component is exported as-is.
export default sentry ? sentry.wrap(RootLayout) : RootLayout;
