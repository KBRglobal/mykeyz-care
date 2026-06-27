import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import { Home, type LucideIcon } from "lucide-react-native";
import { trades } from "@/src/data/catalog";
import { identify, reset as resetAnalytics, trackEvent } from "@/src/integrations/analytics";
import {
  ensureSession,
  hasSession,
  initSession,
  logout as apiLogout,
  requestOtp as apiRequestOtp,
  verifyOtp as apiVerifyOtp,
  completeJob as apiCompleteJob,
  getEarnings,
  getSupplier,
  listConversations,
  listJobs,
  listMessages,
  listSupplierJobs,
  revealJobBudget as apiRevealJobBudget,
  getReveals as apiGetReveals,
  getEntitlement as apiGetEntitlement,
  submitApplePurchase as apiSubmitApplePurchase,
  sendMessage as apiSendMessage,
  submitQuote,
  editQuote as apiEditQuote,
  withdrawQuote as apiWithdrawQuote,
  updateSupplier as apiUpdateSupplier,
  saveTrades as apiSaveTrades,
  saveServiceAreas as apiSaveServiceAreas,
  saveLanguage as apiSaveLanguage,
  addDocument as apiAddDocument,
  submitVerification as apiSubmitVerification,
  completeOnboarding as apiCompleteOnboarding,
  uploadFile,
  type ApiConversation,
  type SupplierEarnings,
  type ApiJob,
  type ApiMessage,
  type ApiSupplier,
  type RevealWallet,
  type Entitlement,
} from "@/src/services/api";

const STORAGE_KEY = "mykeyz-care-state-v1";

// Neutral provider defaults — NO mock identity. Real values come from getSupplier() after login;
// until then the dashboard renders empty/skeleton states, never a fake name.
export const defaultProvider = {
  name: "",
  plan: "",
  rating: 0,
  jobsWon: 0,
  winRate: "",
  revealsLeft: 0,
  services: [] as string[],
  icon: Home as LucideIcon,
};

// Map a job's trade_category to an icon from the real trade catalog (no mock-job dependency).
const TRADE_ICONS: Record<string, LucideIcon> = Object.fromEntries(trades.map((t) => [t.key, t.icon]));
function iconForTrade(tradeCategory: string): LucideIcon {
  return TRADE_ICONS[tradeCategory] ?? Home;
}

/** Result of a reveal attempt — the screen branches on this; never throws. */
export type RevealOutcome =
  | { ok: true; revealedAmount: number; revealsRemaining: number; chargedCredits: boolean }
  | { ok: false; needsPurchase: boolean; error: string };

/** Result of an IAP purchase (plan or single-reveal) validated server-side. */
export type PurchaseOutcome = { ok: true; entitlement: Entitlement } | { ok: false; error: string };

// --- Dev store stub (Sprint 9) -------------------------------------------------------
// The real store purchase (expo-iap) is not yet wired. Until it is, we build a dev-stub
// signed transaction the Sprint 9 server accepts (base64url header.payload.sig), so the
// store -> validate -> apply -> refetch path runs end to end. The SERVER still decides
// every benefit — this only stands in for the native store handing back a receipt.

const B64URL_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function base64UrlJson(value: unknown): string {
  const text = JSON.stringify(value);
  let output = "";
  for (let index = 0; index < text.length; index += 3) {
    const a = text.charCodeAt(index);
    const hasB = index + 1 < text.length;
    const hasC = index + 2 < text.length;
    const b = hasB ? text.charCodeAt(index + 1) : 0;
    const c = hasC ? text.charCodeAt(index + 2) : 0;
    output += B64URL_ALPHABET[a >> 2];
    output += B64URL_ALPHABET[((a & 3) << 4) | (b >> 4)];
    output += hasB ? B64URL_ALPHABET[((b & 15) << 2) | (c >> 6)] : "";
    output += hasC ? B64URL_ALPHABET[c & 63] : "";
  }
  return output;
}

/**
 * TODO(store): replace with the real expo-iap purchase result. On a production build this
 * is where we present the App Store sheet and read back the signed transaction JWS, then
 * pass THAT to submitApplePurchase. The dev stub keeps each transaction id unique so the
 * server records a real (non-replay) purchase every tap.
 */
function buildStubAppleTransaction(productId: string): string {
  const header = base64UrlJson({ alg: "ES256" });
  const payload = base64UrlJson({
    originalTransactionId: `dev-${productId}-${Date.now()}`,
    productId,
    expiresDate: null,
  });
  return `${header}.${payload}.sig`;
}

export type QuoteStatus = "draft" | "sent" | "won" | "lost";

export type SentQuote = {
  id: string;
  jobId: string;
  amount: number;
  status: QuoteStatus;
  createdAt: string;
};

export type ProviderJob = {
  id: string;
  title: string;
  trade: string;
  icon: LucideIcon;
  area: string;
  home: string;
  estimate: number;
  distance: string;
  issue: string;
  status: "new" | "quoted" | "active" | "completed";
  quote?: number;
  competitorPrice?: number;
};

export type QuoteState = "pending" | "won" | "lost" | "withdrawn";

export type ActiveJobBase = {
  id: string;
  title: string;
  customer: string;
  area: string;
  price: number;
  when: string;
  status: string;
};

export type ActiveJob = ActiveJobBase & {
  completed?: boolean;
  // Sprint 5 quote lifecycle (only present on API-driven supplier jobs).
  quoteId?: string;
  quoteState?: QuoteState;
  jobOpen?: boolean;
};

export type ConversationItem = {
  id: string;
  name: string;
  preview: string;
  job: string;
  unread: number;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderType: "supplier" | "customer";
  // Masked '•••' span when flagged — the raw text is never carried client-side.
  body: string;
  // = stored (already-masked) body; safe to reveal via the per-message toggle.
  originalBody?: string;
  translatedBody?: string;
  recipientLanguage?: string;
  language?: string;
  flagged?: boolean;
  masked?: boolean;
  moderationStatus?: "clean" | "flagged";
  // Inline warning surfaced on a just-sent flagged message (from the moderation verdict).
  warning?: string | null;
  createdAt: string;
};

type EarningsState = {
  // this_week / this_month gross the provider was paid by customers.
  week: number;
  month: number;
  // Lifetime ledger-derived totals. `commissionOwed` = money the provider OWES MyKeyz
  // (collected later via the in-app store); `totalNet` = "you keep". Never a payout.
  totalGross: number;
  totalNet: number;
  commissionOwed: number;
  bars: number[];
  transactions: { id: string; jobName: string; netAmount: number; commission: number; grossAmount: number }[];
};

type AppState = {
  setupComplete: boolean;
  language: string;
  simpleMode: boolean;
  provider: typeof defaultProvider;
  supplierId: string;
  phone: string;
  email: string;
  selectedTradeKeys: string[];
  selectedAreas: string[];
  coversAllDubai: boolean;
  businessName: string;
  tradeLicenseNumber: string;
  verificationStatus: ApiSupplier["verification_status"];
  licenseDocUrl: string | null;
  jobs: ProviderJob[];
  activeJobs: ActiveJob[];
  conversations: ConversationItem[];
  messages: Record<string, ChatMessage[]>;
  sentQuotes: SentQuote[];
  revealedJobIds: string[];
  availability: Record<string, string[]>;
  profileGallery: string[];
  // Reveal balance is SERVER-authoritative: revealCredits is only ever assigned from
  // the API (supplier.reveals_remaining or wallet.reveals_remaining), never computed here.
  revealCredits: number;
  wallet: RevealWallet | null;
  // Server-authoritative entitlement (plan + reveals_remaining). Granted ONLY by a
  // validated Apple/Google IAP — the client never sets its own plan or reveal balance.
  entitlement: Entitlement | null;
  totalEarned: number;
  earnings: EarningsState;
  quotesSent: number;
  completedJobs: number;
  quoteError: string | null;
};

type Action =
  | { type: "hydrate"; state: AppState }
  | { type: "completeSetup" }
  | { type: "setLanguage"; language: string }
  | { type: "setPhone"; phone: string }
  | { type: "setEmail"; email: string }
  | { type: "setSupplier"; supplier: ApiSupplier }
  | { type: "toggleTrade"; tradeKey: string }
  | { type: "toggleArea"; area: string }
  | { type: "setCoversAllDubai"; value: boolean }
  | { type: "updateBusiness"; businessName: string; tradeLicenseNumber: string }
  | { type: "setLicenseDoc"; url: string }
  | { type: "setJobs"; jobs: ProviderJob[] }
  | { type: "setActiveJobs"; jobs: ActiveJob[] }
  | { type: "setEarnings"; earnings: EarningsState }
  | { type: "setConversations"; conversations: ConversationItem[] }
  | { type: "setMessages"; conversationId: string; messages: ChatMessage[] }
  | { type: "appendMessage"; conversationId: string; message: ChatMessage }
  | { type: "replaceMessage"; conversationId: string; tempId: string; message: ChatMessage }
  | { type: "sendQuote"; jobId: string; amount: number }
  | { type: "revertQuote"; jobId: string }
  | { type: "setQuoteError"; error: string | null }
  | { type: "setWallet"; wallet: RevealWallet }
  | { type: "setEntitlement"; entitlement: Entitlement }
  | { type: "revealSuccess"; jobId: string; wallet: RevealWallet }
  | { type: "completeJob"; jobId?: string }
  | { type: "toggleSimpleMode" }
  | { type: "toggleAvailabilitySlot"; date: string; slot: string }
  | { type: "addGalleryImage"; uri: string }
  | { type: "reset" };

const initialState: AppState = {
  setupComplete: false,
  language: "en",
  simpleMode: false,
  provider: defaultProvider,
  supplierId: "",
  phone: "",
  email: "",
  selectedTradeKeys: [],
  selectedAreas: [],
  coversAllDubai: false,
  businessName: "",
  tradeLicenseNumber: "",
  verificationStatus: "draft",
  licenseDocUrl: null,
  // The feed is API-driven (matched jobs only) — never seed it from mock data.
  jobs: [],
  activeJobs: [],
  conversations: [],
  messages: {},
  sentQuotes: [],
  revealedJobIds: [],
  availability: {},
  profileGallery: [],
  revealCredits: 0,
  wallet: null,
  entitlement: null,
  // Ledger-derived; zero until the API hydrates real values. No mock/hardcoded totals.
  totalEarned: 0,
  earnings: {
    week: 0,
    month: 0,
    totalGross: 0,
    totalNet: 0,
    commissionOwed: 0,
    bars: [],
    transactions: [],
  },
  quotesSent: 0,
  completedJobs: 0,
  quoteError: null,
};

function restoreState(stored: Partial<AppState>): AppState {
  // Jobs are API-driven now; persisted jobs lose their (function) icon on
  // serialize, so re-attach a fallback icon by position. listJobs() refreshes
  // them on boot.
  const restoredJobs = (stored.jobs ?? []).map((job) => ({
    ...job,
    icon: iconForTrade(job.trade.toLowerCase()),
  }));

  return {
    ...initialState,
    ...stored,
    provider: { ...defaultProvider, ...stored.provider, icon: defaultProvider.icon },
    jobs: restoredJobs,
    activeJobs: stored.activeJobs ?? initialState.activeJobs,
    conversations: stored.conversations ?? initialState.conversations,
    messages: stored.messages ?? initialState.messages,
    sentQuotes: stored.sentQuotes ?? initialState.sentQuotes,
    revealedJobIds: stored.revealedJobIds ?? initialState.revealedJobIds,
    availability: stored.availability ?? initialState.availability,
    profileGallery: stored.profileGallery ?? initialState.profileGallery,
  };
}

function serializeState(state: AppState) {
  return {
    ...state,
    provider: {
      ...state.provider,
      icon: undefined,
    },
    jobs: state.jobs.map((job) => ({
      ...job,
      icon: undefined,
    })),
  };
}

function mapApiJob(job: ApiJob): ProviderJob {
  return {
    id: job.id,
    title: job.service_type,
    trade: job.trade_category.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    icon: iconForTrade(job.trade_category),
    area: job.location_area,
    home: job.location_address,
    estimate: Math.round((job.estimated_value_min + job.estimated_value_max) / 2),
    distance: "",
    issue: job.description,
    status: job.status === "open" ? "new" : job.status === "completed" ? "completed" : "active",
    // Hidden until this provider reveals it — the server returns null otherwise.
    competitorPrice: job.competitor_amount ?? undefined,
  };
}

function mapSupplier(supplier: ApiSupplier, currentProvider: typeof defaultProvider) {
  return {
    ...currentProvider,
    name: supplier.full_name,
    plan: supplier.plan,
    rating: supplier.rating,
    revealsLeft: supplier.reveals_remaining,
    services: supplier.trades,
    icon: defaultProvider.icon,
  };
}

function mapApiConversation(conversation: ApiConversation): ConversationItem {
  return {
    id: conversation.id,
    name: conversation.customer_name,
    preview: conversation.last_message,
    job: conversation.job_id,
    unread: conversation.unread_count,
  };
}

function mapApiMessage(message: ApiMessage): ChatMessage {
  return {
    id: message.id,
    conversationId: message.conversation_id,
    senderType: message.sender_type,
    body: message.body,
    originalBody: message.original_body,
    translatedBody: message.translated_body,
    recipientLanguage: message.recipient_language,
    language: message.language,
    flagged: message.flagged,
    masked: message.masked,
    moderationStatus: message.moderation_status,
    createdAt: message.created_at,
  };
}

function mapApiEarnings(data: SupplierEarnings): EarningsState {
  return {
    week: data.summary.this_week,
    month: data.summary.this_month,
    totalGross: data.summary.total_gross,
    totalNet: data.summary.total_net,
    commissionOwed: data.summary.commission_owed,
    bars: data.weekly_chart.map((item) => item.gross),
    transactions: data.transactions.map((item) => ({
      id: item.job_id,
      jobName: item.job_name,
      grossAmount: item.gross_amount,
      commission: item.commission,
      netAmount: item.net_amount,
    })),
  };
}

function toQuoteState(status: unknown): QuoteState | undefined {
  switch (status) {
    case "won":
    case "lost":
    case "withdrawn":
    case "pending":
      return status;
    // 'shortlisted' is still in the running — surface it like a live quote.
    case "shortlisted":
      return "pending";
    default:
      return undefined;
  }
}

function mapActiveJobs(jobs: Array<ApiJob & { quote?: any }>): ActiveJob[] {
  return jobs.map((job) => {
    const quoteState = toQuoteState(job.quote?.status);
    return {
      id: job.id,
      title: job.service_type,
      customer: "MyKeyz customer",
      area: job.location_area,
      price: Number(job.quote?.amount ?? Math.round((job.estimated_value_min + job.estimated_value_max) / 2)),
      when: job.quote?.availability ?? "Awaiting customer",
      status:
        quoteState === "won" || job.status === "assigned"
          ? "Won"
          : quoteState === "lost"
            ? "Not selected"
            : quoteState === "withdrawn"
              ? "Withdrawn"
              : job.status === "completed"
                ? "Completed"
                : job.status === "in_progress"
                  ? "Confirmed"
                  : "Quoted",
      completed: job.status === "completed",
      quoteId: job.quote?.id,
      quoteState,
      jobOpen: job.status === "open",
    };
  });
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "completeSetup":
      return { ...state, setupComplete: true };
    case "setLanguage":
      return { ...state, language: action.language };
    case "setPhone":
      return { ...state, phone: action.phone };
    case "setEmail":
      return { ...state, email: action.email };
    case "setSupplier":
      return {
        ...state,
        supplierId: action.supplier.id,
        phone: action.supplier.phone ?? "",
        email: action.supplier.email ?? "",
        selectedAreas: action.supplier.coverage_areas,
        coversAllDubai: action.supplier.covers_all_dubai,
        selectedTradeKeys: action.supplier.trades,
        businessName: action.supplier.business_name,
        tradeLicenseNumber: action.supplier.trade_license_number,
        verificationStatus: action.supplier.verification_status,
        provider: mapSupplier(action.supplier, state.provider),
        revealCredits: action.supplier.reveals_remaining,
      };
    case "toggleTrade": {
      const selected = state.selectedTradeKeys.includes(action.tradeKey);
      const next = selected
        ? state.selectedTradeKeys.filter((key) => key !== action.tradeKey)
        : [...state.selectedTradeKeys, action.tradeKey];
      return { ...state, selectedTradeKeys: next };
    }
    case "toggleArea": {
      const selected = state.selectedAreas.includes(action.area);
      const next = selected
        ? state.selectedAreas.filter((area) => area !== action.area)
        : [...state.selectedAreas, action.area];
      return { ...state, selectedAreas: next };
    }
    case "setCoversAllDubai":
      return { ...state, coversAllDubai: action.value };
    case "updateBusiness":
      return {
        ...state,
        businessName: action.businessName,
        tradeLicenseNumber: action.tradeLicenseNumber,
      };
    case "setLicenseDoc":
      return { ...state, licenseDocUrl: action.url };
    case "setJobs":
      return { ...state, jobs: action.jobs };
    case "setActiveJobs":
      return { ...state, activeJobs: action.jobs };
    case "setEarnings":
      return { ...state, earnings: action.earnings, totalEarned: action.earnings.month };
    case "setConversations":
      return { ...state, conversations: action.conversations };
    case "setMessages":
      return {
        ...state,
        messages: { ...state.messages, [action.conversationId]: action.messages },
      };
    case "appendMessage":
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.conversationId]: [...(state.messages[action.conversationId] ?? []), action.message],
        },
        conversations: state.conversations.map((conversation) =>
          conversation.id === action.conversationId ? { ...conversation, preview: action.message.body } : conversation,
        ),
      };
    case "replaceMessage": {
      // Swap the optimistic placeholder for the server-stored message (masked when
      // flagged) — falls back to append if the placeholder is already gone.
      const list = state.messages[action.conversationId] ?? [];
      const exists = list.some((message) => message.id === action.tempId);
      const nextList = exists
        ? list.map((message) => (message.id === action.tempId ? action.message : message))
        : [...list, action.message];
      return {
        ...state,
        messages: { ...state.messages, [action.conversationId]: nextList },
        conversations: state.conversations.map((conversation) =>
          conversation.id === action.conversationId ? { ...conversation, preview: action.message.body } : conversation,
        ),
      };
    }
    case "sendQuote": {
      const alreadyQuoted = state.jobs.find((job) => job.id === action.jobId)?.status === "quoted";
      const quote: SentQuote = {
        id: `${action.jobId}-${Date.now()}`,
        jobId: action.jobId,
        amount: action.amount,
        status: "sent",
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        quoteError: null,
        quotesSent: alreadyQuoted ? state.quotesSent : state.quotesSent + 1,
        sentQuotes: [quote, ...state.sentQuotes.filter((item) => item.jobId !== action.jobId)],
        jobs: state.jobs.map((job) =>
          job.id === action.jobId ? { ...job, status: "quoted", quote: action.amount } : job,
        ),
      };
    }
    case "revertQuote":
      return {
        ...state,
        quotesSent: Math.max(0, state.quotesSent - 1),
        sentQuotes: state.sentQuotes.filter((item) => item.jobId !== action.jobId),
        jobs: state.jobs.map((job) =>
          job.id === action.jobId ? { ...job, status: "new", quote: undefined } : job,
        ),
      };
    case "setQuoteError":
      return { ...state, quoteError: action.error };
    case "setWallet":
      // Balance comes straight from the server wallet — never recomputed locally.
      return { ...state, wallet: action.wallet, revealCredits: action.wallet.reveals_remaining };
    case "setEntitlement":
      // Plan + reveal balance are server truth — read straight from the entitlement.
      return { ...state, entitlement: action.entitlement, revealCredits: action.entitlement.reveals_remaining };
    case "revealSuccess":
      return {
        ...state,
        wallet: action.wallet,
        revealCredits: action.wallet.reveals_remaining,
        revealedJobIds: state.revealedJobIds.includes(action.jobId)
          ? state.revealedJobIds
          : [...state.revealedJobIds, action.jobId],
      };
    case "completeJob": {
      const activeJob = action.jobId
        ? state.activeJobs.find((job) => job.id === action.jobId)
        : state.activeJobs[0];
      if (!activeJob || activeJob.completed) return state;
      const payout = activeJob ? Math.round(activeJob.price * 0.9) : 0;
      return {
        ...state,
        activeJobs: state.activeJobs.map((job) =>
          job.id === activeJob?.id ? { ...job, completed: true, status: "Completed" } : job,
        ),
        completedJobs: state.completedJobs + 1,
        totalEarned: state.totalEarned + payout,
      };
    }
    case "toggleSimpleMode":
      return { ...state, simpleMode: !state.simpleMode };
    case "toggleAvailabilitySlot": {
      const current = state.availability[action.date] ?? [];
      const selected = current.includes(action.slot);
      const nextSlots = selected ? current.filter((slot) => slot !== action.slot) : [...current, action.slot];
      return {
        ...state,
        availability: {
          ...state.availability,
          [action.date]: nextSlots,
        },
      };
    }
    case "addGalleryImage":
      return { ...state, profileGallery: [action.uri, ...state.profileGallery].slice(0, 12) };
    case "reset":
      return initialState;
    default:
      return state;
  }
}

type AppStateContextValue = {
  state: AppState;
  completeSetup: () => void;
  setLanguage: (language: string) => void;
  setPhone: (phone: string) => void;
  setEmail: (email: string) => void;
  requestOtp: (email: string) => Promise<{ expires_in: number; dev_code?: string }>;
  signIn: (email: string, code: string) => Promise<ApiSupplier>;
  logout: () => Promise<void>;
  toggleTrade: (tradeKey: string) => void;
  toggleArea: (area: string) => void;
  setCoversAllDubai: (value: boolean) => void;
  updateBusiness: (businessName: string, tradeLicenseNumber: string) => void;
  saveTrades: () => Promise<void>;
  saveAreas: () => Promise<void>;
  saveBusiness: (businessName: string, tradeLicenseNumber: string) => Promise<void>;
  uploadLicense: (uri: string, contentType?: string) => Promise<void>;
  submitVerification: () => Promise<ApiSupplier>;
  completeOnboarding: () => Promise<void>;
  sendQuote: (jobId: string, amount: number, extra?: { availability?: string; note?: string }) => void;
  withdrawMyQuote: (jobId: string, quoteId: string) => Promise<void>;
  editMyQuote: (
    jobId: string,
    quoteId: string,
    patch: { amount?: number; availability?: string; available_date?: string; note?: string },
  ) => Promise<void>;
  revealJobBudget: (jobId: string) => Promise<RevealOutcome>;
  purchaseReveal: () => Promise<PurchaseOutcome>;
  purchaseProduct: (productId: string) => Promise<PurchaseOutcome>;
  refreshWallet: () => Promise<void>;
  refreshEntitlement: () => Promise<void>;
  completeJob: (jobId?: string) => void;
  toggleSimpleMode: () => void;
  toggleAvailabilitySlot: (date: string, slot: string) => void;
  addGalleryImage: (uri: string) => void;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, body: string) => Promise<void>;
  resetApp: () => void;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) dispatch({ type: "hydrate", state: restoreState(JSON.parse(stored)) });
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(state))).catch(() => undefined);
  }, [state]);

  const loadAll = useCallback(async () => {
    const [supplier, jobs, supplierJobs, earningsResult, conversationsResult, wallet, entitlement] = await Promise.all([
      getSupplier(),
      listJobs(),
      listSupplierJobs(),
      getEarnings(),
      listConversations(),
      // The wallet is the source of truth for the reveal balance; tolerate its failure.
      apiGetReveals().catch(() => null),
      // Entitlement (plan + reveals_remaining) is server truth; tolerate its failure.
      apiGetEntitlement().catch(() => null),
    ]);
    dispatch({ type: "setSupplier", supplier });
    dispatch({ type: "setJobs", jobs: jobs.jobs.map(mapApiJob) });
    dispatch({ type: "setActiveJobs", jobs: mapActiveJobs(supplierJobs.jobs) });
    dispatch({ type: "setEarnings", earnings: mapApiEarnings(earningsResult) });
    dispatch({ type: "setConversations", conversations: conversationsResult.conversations.map(mapApiConversation) });
    if (wallet) dispatch({ type: "setWallet", wallet });
    // Entitlement is set AFTER the wallet so the server's authoritative reveal balance wins.
    if (entitlement) dispatch({ type: "setEntitlement", entitlement });
  }, []);

  // On boot, restore a persisted session and hydrate from the API. Never auto-logs-in.
  useEffect(() => {
    initSession()
      .then(() => {
        if (hasSession()) return loadAll();
      })
      .catch(() => undefined);
  }, [loadAll]);

  // Server-authoritative reveal. The balance shown afterwards comes from the wallet in
  // the response — never decremented locally. A 402 surfaces needsPurchase for the screen.
  const revealJobBudget = useCallback(async (jobId: string): Promise<RevealOutcome> => {
    try {
      await ensureSession();
      const result = await apiRevealJobBudget(jobId);
      if (!result.ok) {
        return { ok: false, needsPurchase: result.status === 402, error: result.error };
      }
      dispatch({ type: "revealSuccess", jobId, wallet: result.wallet });
      trackEvent("price_revealed", { jobId });
      return {
        ok: true,
        revealedAmount: result.revealed_amount,
        revealsRemaining: result.reveals_remaining,
        chargedCredits: result.charged_credits,
      };
    } catch {
      return { ok: false, needsPurchase: false, error: "request_failed" };
    }
  }, []);

  const refreshWallet = useCallback(async () => {
    try {
      await ensureSession();
      const wallet = await apiGetReveals();
      dispatch({ type: "setWallet", wallet });
    } catch {
      // Keep the last known server balance on failure.
    }
  }, []);

  const refreshEntitlement = useCallback(async () => {
    try {
      await ensureSession();
      const entitlement = await apiGetEntitlement();
      dispatch({ type: "setEntitlement", entitlement });
    } catch {
      // Keep the last known server entitlement on failure.
    }
  }, []);

  // Buy a plan or a single reveal via the store IAP, then validate server-side. The store
  // hands back a signed transaction; we POST it to the validate endpoint, which applies the
  // benefit SERVER-SIDE and returns the fresh entitlement. We then refetch the wallet so the
  // reveal ledger surfaces stay in sync. Nothing is granted or decremented on the client.
  const purchaseProduct = useCallback(
    async (productId: string): Promise<PurchaseOutcome> => {
      try {
        await ensureSession();
        // TODO(store): swap this dev stub for the real expo-iap purchase result.
        const signedTransaction = buildStubAppleTransaction(productId);
        const result = await apiSubmitApplePurchase(signedTransaction);
        if (!result.ok) return { ok: false, error: result.error };
        dispatch({ type: "setEntitlement", entitlement: result.entitlement });
        await refreshWallet();
        trackEvent("iap_purchase_validated", { productId });
        return { ok: true, entitlement: result.entitlement };
      } catch {
        return { ok: false, error: "request_failed" };
      }
    },
    [refreshWallet],
  );

  // Single-reveal upsell — flows through the SAME IAP validate path (care_reveal_single).
  const purchaseReveal = useCallback((): Promise<PurchaseOutcome> => purchaseProduct("care_reveal_single"), [purchaseProduct]);

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      completeSetup: () => dispatch({ type: "completeSetup" }),
      setLanguage: (language) => dispatch({ type: "setLanguage", language }),
      setPhone: (phone) => dispatch({ type: "setPhone", phone }),
      setEmail: (email) => dispatch({ type: "setEmail", email }),
      requestOtp: (email) => apiRequestOtp(email),
      signIn: async (email, code) => {
        const result = await apiVerifyOtp(email, code);
        dispatch({ type: "setSupplier", supplier: result.supplier });
        dispatch({ type: "setEmail", email: result.supplier.email ?? email });
        // Tie analytics to the authenticated supplier and record the login.
        identify(result.supplier.id);
        trackEvent("login", {});
        await loadAll().catch(() => undefined);
        return result.supplier;
      },
      logout: async () => {
        await apiLogout();
        // Decouple analytics from the supplier so the next session starts anonymous.
        resetAnalytics();
        dispatch({ type: "reset" });
      },
      toggleTrade: (tradeKey) => dispatch({ type: "toggleTrade", tradeKey }),
      toggleArea: (area) => dispatch({ type: "toggleArea", area }),
      setCoversAllDubai: (value) => dispatch({ type: "setCoversAllDubai", value }),
      updateBusiness: (businessName, tradeLicenseNumber) =>
        dispatch({ type: "updateBusiness", businessName, tradeLicenseNumber }),
      saveTrades: async () => {
        await ensureSession();
        const supplier = await apiSaveTrades(state.selectedTradeKeys);
        dispatch({ type: "setSupplier", supplier });
      },
      saveAreas: async () => {
        await ensureSession();
        const supplier = await apiSaveServiceAreas(state.coversAllDubai ? [] : state.selectedAreas, state.coversAllDubai);
        dispatch({ type: "setSupplier", supplier });
      },
      saveBusiness: async (businessName, tradeLicenseNumber) => {
        dispatch({ type: "updateBusiness", businessName, tradeLicenseNumber });
        await ensureSession();
        await apiUpdateSupplier({ business_name: businessName, trade_license_number: tradeLicenseNumber });
        if (state.language) await apiSaveLanguage(state.language).catch(() => undefined);
        const supplier = await getSupplier();
        dispatch({ type: "setSupplier", supplier });
      },
      uploadLicense: async (uri, contentType = "image/jpeg") => {
        await ensureSession();
        const { public_url, storage_key } = await uploadFile(uri, "trade_license", contentType);
        await apiAddDocument("trade_license", public_url, storage_key);
        dispatch({ type: "setLicenseDoc", url: public_url });
        trackEvent("license_uploaded", {});
      },
      submitVerification: async () => {
        await ensureSession();
        const supplier = await apiSubmitVerification();
        dispatch({ type: "setSupplier", supplier });
        trackEvent("verification_submitted", {});
        return supplier;
      },
      completeOnboarding: async () => {
        await ensureSession();
        const supplier = await apiCompleteOnboarding();
        dispatch({ type: "setSupplier", supplier });
        dispatch({ type: "completeSetup" });
        trackEvent("onboarding_completed", {});
      },
      sendQuote: (jobId, amount, extra) => {
        // Gate: unapproved suppliers can never quote — surface a flag, skip the API.
        if (state.verificationStatus !== "approved") {
          dispatch({ type: "setQuoteError", error: "not_verified" });
          trackEvent("quote_blocked", { jobId, reason: "not_verified" });
          return;
        }
        dispatch({ type: "sendQuote", jobId, amount });
        ensureSession()
          .then(() => submitQuote(jobId, amount, extra))
          .then((result) => {
            if (!result.ok) {
              // 403 (not_verified / not_matched) → roll back the optimistic quote.
              if (result.status === 403) dispatch({ type: "revertQuote", jobId });
              dispatch({ type: "setQuoteError", error: result.error });
            }
          })
          .catch(() => {
            dispatch({ type: "revertQuote", jobId });
            dispatch({ type: "setQuoteError", error: "request_failed" });
          });
        trackEvent("quote_sent", { jobId, amount });
      },
      withdrawMyQuote: async (jobId, quoteId) => {
        dispatch({ type: "setQuoteError", error: null });
        try {
          await ensureSession();
          const result = await apiWithdrawQuote(jobId, quoteId);
          if (!result.ok) {
            // 409 not_withdrawable / 404 not_found — surface for the screen.
            dispatch({ type: "setQuoteError", error: result.error });
            trackEvent("quote_withdraw_blocked", { jobId, reason: result.error });
            return;
          }
          await loadAll().catch(() => undefined);
          trackEvent("quote_withdrawn", { jobId });
        } catch {
          dispatch({ type: "setQuoteError", error: "request_failed" });
        }
      },
      editMyQuote: async (jobId, quoteId, patch) => {
        dispatch({ type: "setQuoteError", error: null });
        try {
          await ensureSession();
          const result = await apiEditQuote(jobId, quoteId, patch);
          if (!result.ok) {
            // 409 edit_window_closed / 404 not_found — surface for the screen.
            dispatch({ type: "setQuoteError", error: result.error });
            trackEvent("quote_edit_blocked", { jobId, reason: result.error });
            return;
          }
          await loadAll().catch(() => undefined);
          trackEvent("quote_edited", { jobId });
        } catch {
          dispatch({ type: "setQuoteError", error: "request_failed" });
        }
      },
      revealJobBudget,
      purchaseReveal,
      purchaseProduct,
      refreshWallet,
      refreshEntitlement,
      completeJob: (jobId) => {
        dispatch({ type: "completeJob", jobId });
        if (jobId) {
          ensureSession()
            .then(() => apiCompleteJob(jobId))
            .then(() => listSupplierJobs())
            .then((result) => dispatch({ type: "setActiveJobs", jobs: mapActiveJobs(result.jobs) }))
            .catch(() => undefined);
        }
        trackEvent("job_completed", { jobId: jobId ?? null });
      },
      toggleSimpleMode: () => {
        dispatch({ type: "toggleSimpleMode" });
        trackEvent("simple_mode_toggled", { enabled: !state.simpleMode });
      },
      toggleAvailabilitySlot: (date, slot) => {
        dispatch({ type: "toggleAvailabilitySlot", date, slot });
        trackEvent("availability_changed", { date, slot });
      },
      addGalleryImage: (uri) => {
        dispatch({ type: "addGalleryImage", uri });
        ensureSession()
          .then(() => uploadFile(uri, "work_photo"))
          .then(({ public_url }) => dispatch({ type: "addGalleryImage", uri: public_url }))
          .catch(() => undefined);
      },
      loadMessages: async (conversationId) => {
        try {
          await ensureSession();
          const result = await listMessages(conversationId);
          dispatch({ type: "setMessages", conversationId, messages: result.messages.map(mapApiMessage) });
        } catch {
          dispatch({
            type: "setMessages",
            conversationId,
            messages: [
              {
                id: "local-msg-1",
                conversationId,
                senderType: "customer",
                body: state.conversations.find((item) => item.id === conversationId)?.preview ?? "Can you come tomorrow morning?",
                createdAt: new Date().toISOString(),
              },
            ],
          });
        }
      },
      sendMessage: async (conversationId, body) => {
        const localMessage: ChatMessage = {
          id: `local-${Date.now()}`,
          conversationId,
          senderType: "supplier",
          body,
          language: state.language,
          createdAt: new Date().toISOString(),
        };
        dispatch({ type: "appendMessage", conversationId, message: localMessage });
        try {
          await ensureSession();
          const result = await apiSendMessage(conversationId, body, state.language);
          if (result.ok) {
            // Swap the raw optimistic bubble for the stored message: when the leakage
            // detector flags it the body comes back masked and we attach the warning so
            // the chat screen can show the inline notice (the raw is never carried here).
            const saved: ChatMessage = { ...mapApiMessage(result.message), warning: result.moderation.warning };
            dispatch({ type: "replaceMessage", conversationId, tempId: localMessage.id, message: saved });
            if (result.moderation.flagged) trackEvent("message_flagged", { conversationId });
          }
        } catch {
          undefined;
        }
      },
      resetApp: () => dispatch({ type: "reset" }),
    }),
    [revealJobBudget, purchaseReveal, purchaseProduct, refreshWallet, refreshEntitlement, state, loadAll],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) throw new Error("useAppState must be used within AppStateProvider");
  return value;
}
