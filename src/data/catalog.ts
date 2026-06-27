import {
  AirVent,
  BadgeCheck,
  Brush,
  Building2,
  Camera,
  Droplets,
  FileUp,
  Hammer,
  Home,
  Plug,
  Sparkles,
  type LucideIcon,
} from "lucide-react-native";

// Static product catalogs (NOT mock data). Real supplier/job/earnings data comes from the API.

export type Trade = {
  key: string;
  label: string;
  icon: LucideIcon;
};

export const trades: Trade[] = [
  { key: "painting", label: "Painting", icon: Brush },
  { key: "plumbing", label: "Plumbing", icon: Droplets },
  { key: "ac", label: "AC", icon: AirVent },
  { key: "electrical", label: "Electrical", icon: Plug },
  { key: "carpentry", label: "Carpentry", icon: Hammer },
  { key: "cleaning", label: "Cleaning", icon: Sparkles },
];

export const setupSteps = [
  { key: "phone", label: "Phone", icon: Home },
  { key: "trade", label: "Trade", icon: Brush },
  { key: "business", label: "Business", icon: Building2 },
  { key: "license", label: "License", icon: FileUp },
  { key: "review", label: "Review", icon: BadgeCheck },
];

export const serviceAreas = [
  "Dubai Marina",
  "Palm Jumeirah",
  "Downtown Dubai",
  "JLT",
  "Business Bay",
  "Arabian Ranches",
];

export const verificationBenefits = [
  { title: "High-value jobs", body: "Access premium villa and renovation tenders.", icon: BadgeCheck },
  { title: "Verified profile", body: "Customers see a stronger trust signal.", icon: Camera },
  { title: "Priority ranking", body: "Verified providers appear higher in customer matches.", icon: Sparkles },
];
