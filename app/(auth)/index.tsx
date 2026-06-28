import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { ArrowRight, CheckCircle2, Languages, Target } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { TradeOrbit } from "@/src/components/product/TradeOrbit";
import { AppText } from "@/src/components/ui/AppText";
import { BrandMark } from "@/src/components/ui/BrandMark";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { ProgressDots } from "@/src/components/ui/ProgressDots";
import { Screen } from "@/src/components/ui/Screen";
import { supportedLanguages } from "@/src/i18n";
import { useAppState } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

const slides = ["work", "fit", "language"] as const;

export default function WelcomeScreen() {
  const [index, setIndex] = useState(0);
  const { i18n, t } = useTranslation();
  const { state, setLanguage } = useAppState();
  const slide = slides[index];

  useEffect(() => {
    if (state.setupComplete) router.replace("/(tabs)");
  }, [state.setupComplete]);

  const next = () => {
    if (index === slides.length - 1) {
      router.push("/(setup)/email");
      return;
    }
    setIndex((current) => current + 1);
  };

  const title = useMemo(() => {
    if (slide === "work") return t("welcome1Title");
    if (slide === "fit") return t("welcome2Title");
    return t("welcome3Title");
  }, [slide, t]);

  const body = useMemo(() => {
    if (slide === "work") return t("welcome1Body");
    if (slide === "fit") return t("welcome2Body");
    return t("welcome3Body");
  }, [slide, t]);

  return (
    <Screen scroll={false} style={styles.root} contentStyle={styles.content}>
      <View style={styles.header}>
        <BrandMark />
        <Pressable
          style={styles.language}
          onPress={() => {
            const current = supportedLanguages.findIndex((item) => item.code === i18n.language);
            const nextLanguage = supportedLanguages[(current + 1) % supportedLanguages.length];
            i18n.changeLanguage(nextLanguage.code);
            setLanguage(nextLanguage.code);
          }}
        >
          <Languages color={theme.colors.mutedForeground} size={17} />
          <AppText variant="eyebrow">{t("language")}</AppText>
        </Pressable>
      </View>

      <View style={styles.hero}>
        {slide === "work" ? <TradeOrbit /> : null}
        {slide === "fit" ? <MatchingPreview /> : null}
        {slide === "language" ? <LanguagePreview /> : null}
      </View>

      <View style={styles.copy}>
        <AppText variant="heading" align="center" style={styles.slideTitle}>
          {title}
        </AppText>
        <AppText align="center" color={theme.colors.mutedForeground} style={styles.body}>
          {body}
        </AppText>
      </View>

      <View style={styles.footer}>
        <ProgressDots index={index} total={slides.length} />
        {index === slides.length - 1 ? (
          <Button label={t("start")} onPress={next} style={styles.startButton} />
        ) : (
          <Pressable onPress={next} style={styles.nextButton}>
            <ArrowRight color={theme.colors.primaryForeground} size={28} strokeWidth={3} />
          </Pressable>
        )}
      </View>
    </Screen>
  );
}

// Honest feature explainer — no sample jobs/prices. Real matched jobs appear in-app after sign-in.
function MatchingPreview() {
  return (
    <View style={styles.fitStack}>
      <Card muted style={styles.matchCard}>
        <View style={styles.matchIcon}>
          <Target color={theme.colors.accent} size={22} />
        </View>
        <View style={styles.matchCopy}>
          <AppText variant="eyebrow">Matched to you</AppText>
          <AppText variant="label" style={styles.matchTitle}>
            Your trades & areas
          </AppText>
        </View>
        <CheckCircle2 color={theme.colors.success} fill={theme.colors.success} size={22} />
      </Card>
      <AppText align="center" color={theme.colors.mutedForeground}>
        Only jobs that fit your trades and service areas reach you — no noise.
      </AppText>
    </View>
  );
}

// Honest feature explainer for two-way translation — no sample conversation or prices.
function LanguagePreview() {
  return (
    <View style={styles.languageStack}>
      <Card muted style={styles.translationCard}>
        <Languages color={theme.colors.accent} size={30} />
        <AppText align="center" color={theme.colors.mutedForeground}>
          Chat with customers in your own language — messages are translated both
          ways automatically, so nothing gets lost.
        </AppText>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: theme.colors.surface,
  },
  content: {
    flex: 1,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  language: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },
  hero: {
    flex: 1,
    justifyContent: "center",
    minHeight: 310,
  },
  fitStack: {
    gap: 14,
    marginTop: 12,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  chipDark: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    color: theme.colors.primaryForeground,
    fontFamily: theme.fonts.sansBold,
    fontSize: 10,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 9,
    textTransform: "uppercase",
  },
  chipGold: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.full,
    color: theme.colors.primary,
    fontFamily: theme.fonts.sansBold,
    fontSize: 10,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 9,
    textTransform: "uppercase",
  },
  matchCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    padding: 16,
  },
  softMatch: {
    opacity: 0.52,
  },
  matchIcon: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 15,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  matchCopy: {
    flex: 1,
  },
  matchTitle: {
    textTransform: "uppercase",
  },
  languageStack: {
    gap: 18,
  },
  quoteCard: {
    gap: 22,
    padding: 24,
  },
  quoteHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  whatsapp: {
    alignItems: "center",
    backgroundColor: "#25D366",
    borderRadius: theme.radius.full,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  greenText: {
    color: theme.colors.success,
    textTransform: "uppercase",
  },
  priceRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  priceSoft: {
    color: theme.colors.mutedForeground,
    fontFamily: theme.fonts.sansBold,
    fontSize: 12,
  },
  priceSelected: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.accent,
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  translationCard: {
    alignItems: "center",
    flexDirection: "column",
    gap: 14,
    justifyContent: "center",
    padding: 24,
  },
  bubbleDark: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    maxWidth: "45%",
    padding: 13,
  },
  bubbleLight: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: "45%",
    padding: 13,
  },
  translationFooter: {
    alignItems: "center",
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 10,
    paddingTop: 16,
    width: "100%",
  },
  copy: {
    gap: 14,
    marginBottom: 30,
  },
  slideTitle: {
    fontSize: 34,
  },
  body: {
    alignSelf: "center",
    fontFamily: theme.fonts.sansSemi,
    maxWidth: 310,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  nextButton: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    height: 62,
    justifyContent: "center",
    width: 62,
    ...theme.shadows.floating,
  },
  startButton: {
    flex: 1,
    marginLeft: 24,
  },
});
