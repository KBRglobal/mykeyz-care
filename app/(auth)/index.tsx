import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { ArrowRight, CheckCircle2, Languages, Send } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { TradeOrbit } from "@/src/components/product/TradeOrbit";
import { AppText } from "@/src/components/ui/AppText";
import { BrandMark } from "@/src/components/ui/BrandMark";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { ProgressDots } from "@/src/components/ui/ProgressDots";
import { Screen } from "@/src/components/ui/Screen";
import { supportedLanguages } from "@/src/i18n";
import { useAppState, type ProviderJob } from "@/src/state/AppState";
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
        {slide === "fit" ? <MatchingPreview jobs={state.jobs} /> : null}
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

function MatchingPreview({ jobs }: { jobs: ProviderJob[] }) {
  return (
    <View style={styles.fitStack}>
      <View style={styles.filterRow}>
        <AppText style={styles.chipDark}>Painting</AppText>
        <AppText style={styles.chipDark}>Dubai Marina</AppText>
        <AppText style={styles.chipGold}>Crack</AppText>
      </View>
      {jobs.map((item, itemIndex) => {
        const Icon = item.icon;
        return (
          <Card key={item.id} muted style={[styles.matchCard, itemIndex > 0 ? styles.softMatch : null]}>
            <View style={styles.matchIcon}>
              <Icon color={itemIndex === 0 ? theme.colors.accent : theme.colors.mutedForeground} size={22} />
            </View>
            <View style={styles.matchCopy}>
              <AppText variant="eyebrow">{item.trade}</AppText>
              <AppText variant="label" style={styles.matchTitle}>
                {item.title}
              </AppText>
            </View>
            {itemIndex === 0 ? (
              <CheckCircle2 color={theme.colors.success} fill={theme.colors.success} size={22} />
            ) : null}
          </Card>
        );
      })}
    </View>
  );
}

function LanguagePreview() {
  return (
    <View style={styles.languageStack}>
      <Card muted style={styles.quoteCard}>
        <View style={styles.quoteHeader}>
          <View style={styles.whatsapp}>
            <Send color={theme.colors.primaryForeground} size={18} fill={theme.colors.primaryForeground} />
          </View>
          <AppText variant="label" style={styles.greenText}>
            New quote sent
          </AppText>
        </View>
        <View style={styles.priceRow}>
          <AppText style={styles.priceSoft}>AED 500</AppText>
          <View style={styles.priceSelected}>
            <AppText variant="label">AED 420</AppText>
          </View>
          <AppText style={styles.priceSoft}>AED 350</AppText>
        </View>
        <AppText variant="eyebrow" align="center" color={theme.colors.accent}>
          Customer chooses you
        </AppText>
      </Card>
      <Card muted style={styles.translationCard}>
        <View style={styles.bubbleDark}>
          <AppText variant="label" color={theme.colors.primaryForeground}>
            नमस्ते, मैं काम कर सकता हूँ
          </AppText>
        </View>
        <ArrowRight color={theme.colors.mutedForeground} size={18} />
        <View style={styles.bubbleLight}>
          <AppText variant="label">Hello, I can do the job</AppText>
        </View>
        <View style={styles.translationFooter}>
          <Languages color={theme.colors.accent} size={16} />
          <AppText variant="eyebrow" color={theme.colors.accent}>
            Auto-translation active
          </AppText>
        </View>
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
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    padding: 20,
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
