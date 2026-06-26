export const colors = {
  background: "#F8FAFC",
  surface: "#FFFFFF",
  foreground: "#001534",
  foregroundSoft: "#334155",
  muted: "#F4F7FA",
  mutedStrong: "#EAF0F6",
  mutedForeground: "#8DA0B8",
  primary: "#001534",
  primaryForeground: "#FFFFFF",
  accent: "#E3B341",
  accentForeground: "#001534",
  success: "#18C56E",
  warning: "#F59E0B",
  destructive: "#EF4444",
  info: "#2563EB",
  border: "#E2E8F0",
  shadow: "#0B2144",
  card: "#FFFFFF",
} as const;

export const fonts = {
  sans: "Inter_400Regular",
  sansSemi: "Inter_600SemiBold",
  sansBold: "Inter_700Bold",
  heading: "Montserrat_900Black",
  headingBold: "Montserrat_800ExtraBold",
  mono: "JetBrainsMono_700Bold",
} as const;

export const radius = {
  xs: 12,
  sm: 16,
  md: 22,
  lg: 28,
  xl: 34,
  "2xl": 40,
  full: 999,
} as const;

export const spacing = {
  pageX: 24,
  pageTop: 18,
  tabBar: 92,
} as const;

export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 30,
    elevation: 8,
  },
  floating: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 28,
    elevation: 10,
  },
} as const;

export const theme = { colors, fonts, radius, spacing, shadows } as const;

export type AppTheme = typeof theme;
