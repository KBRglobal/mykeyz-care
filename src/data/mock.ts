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
  MapPin,
  Plug,
  Sparkles,
  type LucideIcon,
} from "lucide-react-native";

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

export const jobs = [
  {
    id: "job-1",
    title: "Cracked Living Room Wall",
    trade: "Painting",
    icon: Brush,
    area: "Dubai Marina",
    home: "2BR Apartment",
    estimate: 500,
    distance: "2.4 km",
    issue: "AI inspection found visible cracks near the window wall.",
  },
  {
    id: "job-2",
    title: "Leaking Kitchen Tap",
    trade: "Plumbing",
    icon: Droplets,
    area: "JLT",
    home: "1BR Apartment",
    estimate: 250,
    distance: "4.1 km",
    issue: "Tenant reported water leaking under the sink during move-in.",
  },
  {
    id: "job-3",
    title: "Cooling Issue - Master BR",
    trade: "AC",
    icon: AirVent,
    area: "Business Bay",
    home: "Studio",
    estimate: 350,
    distance: "5.8 km",
    issue: "Inspection notes: AC turns on but room stays warm.",
  },
];

export const activeJobs = [
  {
    id: "active-1",
    title: "Deep Cleaning",
    customer: "Maria K.",
    area: "Dubai Marina",
    price: 450,
    when: "Tomorrow, 10:00 AM",
    status: "Confirmed",
  },
  {
    id: "active-2",
    title: "AC Service",
    customer: "John D.",
    area: "Business Bay",
    price: 250,
    when: "Friday, 2:30 PM",
    status: "Scheduled",
  },
];

export const conversations = [
  {
    id: "chat-1",
    name: "Maria K.",
    preview: "Can you come tomorrow morning?",
    job: "Deep Cleaning",
    unread: 2,
  },
  {
    id: "chat-2",
    name: "Ahmed R.",
    preview: "Quote received. Thank you.",
    job: "Painting",
    unread: 0,
  },
];

export const provider = {
  name: "Ahmed Rashid",
  plan: "Standard",
  rating: 4.8,
  jobsWon: 47,
  winRate: "67%",
  revealsLeft: 10,
  services: ["Painting", "Cleaning", "AC"],
  icon: Home,
};

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

export const notifications = [
  {
    id: "n1",
    title: "You viewed a job",
    body: "Make a stronger quote before the customer chooses.",
    tone: "success",
  },
  {
    id: "n2",
    title: "New opportunity near you",
    body: "AC repair in JLT Cluster Y needs a provider today.",
    tone: "info",
  },
  {
    id: "n3",
    title: "Profile viewed",
    body: "A tenant in Dubai Marina opened your profile.",
    tone: "warning",
  },
];

export const plans = [
  { name: "Minimal Listing", price: "Free", reveals: "0", badge: "Basic profile" },
  { name: "Bold Visibility", price: "100 AED/mo", reveals: "0", badge: "Verified Expert" },
  { name: "Premium Highlight", price: "349 AED/mo", reveals: "10", badge: "Top Rated" },
  { name: "High Impact Card", price: "599 AED/mo", reveals: "30", badge: "Blue card" },
  { name: "Elite Minisite", price: "999 AED/mo", reveals: "Unlimited", badge: "Full minisite" },
];

export const earnings = {
  month: 4200,
  week: 1800,
  pending: 650,
  commission: 420,
  bars: [180, 260, 220, 410, 360, 520, 610],
};
