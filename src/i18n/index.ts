import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const supportedLanguages = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "ur", label: "Urdu", native: "اردو" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "tl", label: "Tagalog", native: "Tagalog" },
  { code: "ne", label: "Nepali", native: "नेपाली" },
] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number]["code"];

const resources = {
  en: {
    translation: {
      brandCare: "care",
      language: "English",
      welcome1Title: "Jobs From\nReal Homes",
      welcome1Body:
        "Tenants and owners inspect homes in Dubai. When MyKeyz finds a problem, the right provider gets the job.",
      welcome2Title: "Only Jobs\nThat Fit You",
      welcome2Body:
        "Choose your trade, area, and service radius. We send jobs that match real inspection findings.",
      welcome3Title: "Quote In Your\nLanguage",
      welcome3Body:
        "Read job details, send your price, and talk to customers in your language. MyKeyz translates the work.",
      start: "Start Getting Jobs",
      continue: "Continue",
      skip: "Skip",
      home: "Home",
      quotes: "Quotes",
      jobs: "Jobs",
      inbox: "Inbox",
      profile: "Profile",
      hello: "Hello, Ahmed",
      newLeads: "New Leads",
      earned: "Earned",
      nearYou: "New Leads Near You",
      quoteNow: "Quote Now",
      opportunity: "Opportunities",
      activeJobs: "Active Jobs",
      messages: "Messages",
      profileTitle: "My Profile",
      reveal: "Reveal Price",
      submitBid: "Submit Bid",
      navigate: "Navigate",
      message: "Message",
      verifiedJobs: "Verified home inspection jobs",
      simpleMode: "Simple Mode",
    },
  },
  hi: {
    translation: {
      language: "हिन्दी",
      welcome1Title: "असली घरों से\nकाम",
      welcome1Body: "दुबई में घर की inspection के बाद समस्या मिलती है, तो सही provider को काम मिलता है।",
      welcome2Title: "सिर्फ आपके\nलिए सही काम",
      welcome2Body: "अपना trade और area चुनें। हम inspection से निकला सही काम आपको भेजते हैं।",
      welcome3Title: "अपनी भाषा में\nquote दें",
      welcome3Body: "काम पढ़ें, price भेजें, और customer से अपनी भाषा में बात करें। MyKeyz translate करता है।",
    },
  },
  ur: {
    translation: {
      language: "اردو",
      welcome1Title: "اصلی گھروں سے\nکام",
      welcome1Body: "دبئی میں inspection کے بعد مسئلہ ملے تو درست provider کو کام ملتا ہے۔",
      welcome2Title: "صرف آپ کے\nمطابق jobs",
      welcome2Body: "اپنا trade اور area منتخب کریں۔ ہم inspection findings سے matching jobs بھیجتے ہیں۔",
      welcome3Title: "اپنی زبان میں\nquote دیں",
      welcome3Body: "Job details پڑھیں، price بھیجیں، اور customer سے اپنی زبان میں بات کریں۔",
    },
  },
  bn: {
    translation: {
      language: "বাংলা",
      welcome1Title: "বাস্তব বাড়ি থেকে\nকাজ",
      welcome1Body: "দুবাইতে inspection শেষে সমস্যা ধরা পড়লে সঠিক provider কাজ পায়।",
      welcome2Title: "শুধু আপনার\nমতো কাজ",
      welcome2Body: "আপনার trade ও area বেছে নিন। আমরা inspection findings থেকে matched jobs পাঠাই।",
      welcome3Title: "আপনার ভাষায়\nquote দিন",
      welcome3Body: "কাজ পড়ুন, price পাঠান, customer-এর সাথে নিজের ভাষায় কথা বলুন।",
    },
  },
  tl: {
    translation: {
      language: "Tagalog",
      welcome1Title: "Trabaho Mula\nSa Totoong Bahay",
      welcome1Body: "Pag may nakita ang MyKeyz sa inspection, ang tamang provider ang nakakakuha ng job.",
      welcome2Title: "Jobs Na Bagay\nSa Iyo",
      welcome2Body: "Piliin ang trade at area mo. Ipapadala namin ang jobs na tugma sa inspection findings.",
      welcome3Title: "Mag-quote Sa\nWika Mo",
      welcome3Body: "Basahin ang job, ipadala ang price, at kausapin ang customer sa sarili mong wika.",
    },
  },
  ne: {
    translation: {
      language: "नेपाली",
      welcome1Title: "वास्तविक घरबाट\nकाम",
      welcome1Body: "दुबईमा inspection पछि समस्या भेटिएमा सही provider लाई job पठाइन्छ।",
      welcome2Title: "तपाईंलाई मिल्ने\nकाम मात्रै",
      welcome2Body: "आफ्नो trade र area छान्नुहोस्। inspection findings बाट मिल्ने jobs आउँछन्।",
      welcome3Title: "आफ्नै भाषामा\nquote दिनुहोस्",
      welcome3Body: "Job पढ्नुहोस्, price पठाउनुहोस्, customer सँग आफ्नै भाषामा कुरा गर्नुहोस्।",
    },
  },
} as const;

const detected = Localization.getLocales()[0]?.languageCode ?? "en";
const fallbackLng = supportedLanguages.some((item) => item.code === detected) ? detected : "en";

i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  fallbackLng: "en",
  lng: fallbackLng,
  resources,
  interpolation: { escapeValue: false },
});

export { i18n };
