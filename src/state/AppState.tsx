import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import type { LucideIcon } from "lucide-react-native";
import { activeJobs as initialActiveJobs, conversations as initialConversations, earnings, jobs as initialJobs, provider } from "@/src/data/mock";
import { trackEvent } from "@/src/integrations/analytics";
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
  revealPrice as apiRevealPrice,
  sendMessage as apiSendMessage,
  submitQuote,
  updateSupplier as apiUpdateSupplier,
  uploadFile,
  type ApiConversation,
  type ApiEarnings,
  type ApiJob,
  type ApiMessage,
  type ApiSupplier,
} from "@/src/services/api";

const STORAGE_KEY = "mykeyz-care-state-v1";

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

type ActiveJob = (typeof initialActiveJobs)[number] & {
  completed?: boolean;
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
  body: string;
  translatedBody?: string;
  language?: string;
  createdAt: string;
};

type EarningsState = {
  month: number;
  week: number;
  total: number;
  bars: number[];
  transactions: { id: string; jobName: string; netAmount: number; commission: number; grossAmount: number }[];
};

type AppState = {
  setupComplete: boolean;
  language: string;
  simpleMode: boolean;
  provider: typeof provider;
  supplierId: string;
  phone: string;
  selectedTradeKeys: string[];
  selectedAreas: string[];
  businessName: string;
  tradeLicenseNumber: string;
  bankIban: string;
  accountHolder: string;
  jobs: ProviderJob[];
  activeJobs: ActiveJob[];
  conversations: ConversationItem[];
  messages: Record<string, ChatMessage[]>;
  sentQuotes: SentQuote[];
  revealedJobIds: string[];
  availability: Record<string, string[]>;
  profileGallery: string[];
  revealCredits: number;
  totalEarned: number;
  earnings: EarningsState;
  quotesSent: number;
  completedJobs: number;
};

type Action =
  | { type: "hydrate"; state: AppState }
  | { type: "completeSetup" }
  | { type: "setLanguage"; language: string }
  | { type: "setPhone"; phone: string }
  | { type: "setSupplier"; supplier: ApiSupplier }
  | { type: "toggleTrade"; tradeKey: string }
  | { type: "toggleArea"; area: string }
  | { type: "updateBusiness"; businessName: string; tradeLicenseNumber: string }
  | { type: "updateBank"; bankIban: string; accountHolder: string }
  | { type: "setJobs"; jobs: ProviderJob[] }
  | { type: "setActiveJobs"; jobs: ActiveJob[] }
  | { type: "setEarnings"; earnings: EarningsState }
  | { type: "setConversations"; conversations: ConversationItem[] }
  | { type: "setMessages"; conversationId: string; messages: ChatMessage[] }
  | { type: "appendMessage"; conversationId: string; message: ChatMessage }
  | { type: "sendQuote"; jobId: string; amount: number }
  | { type: "revealPrice"; jobId: string }
  | { type: "setRevealCredits"; amount: number }
  | { type: "buyCredits"; amount: number }
  | { type: "completeJob"; jobId?: string }
  | { type: "toggleSimpleMode" }
  | { type: "toggleAvailabilitySlot"; date: string; slot: string }
  | { type: "addGalleryImage"; uri: string }
  | { type: "reset" };

const initialState: AppState = {
  setupComplete: false,
  language: "en",
  simpleMode: false,
  provider,
  supplierId: "",
  phone: "",
  selectedTradeKeys: ["painting", "cleaning"],
  selectedAreas: ["Dubai Marina", "Palm Jumeirah", "Downtown Dubai"],
  businessName: "Rashid Pro Services",
  tradeLicenseNumber: "",
  bankIban: "",
  accountHolder: provider.name,
  jobs: initialJobs.map((job, index) => ({
    ...job,
    status: "new",
    competitorPrice: [380, 230, 325][index] ?? Math.max(120, job.estimate - 80),
  })),
  activeJobs: initialActiveJobs,
  conversations: initialConversations,
  messages: {},
  sentQuotes: [],
  revealedJobIds: [],
  availability: {},
  profileGallery: [],
  revealCredits: 10,
  totalEarned: earnings.month,
  earnings: {
    month: earnings.month,
    week: earnings.week,
    total: 18500,
    bars: earnings.bars,
    transactions: [],
  },
  quotesSent: 0,
  completedJobs: 0,
};

function restoreState(stored: Partial<AppState>): AppState {
  const restoredJobs = initialState.jobs.map((initialJob) => {
    const storedJob = stored.jobs?.find((job) => job.id === initialJob.id);
    return {
      ...initialJob,
      ...storedJob,
      icon: initialJob.icon,
    };
  });

  return {
    ...initialState,
    ...stored,
    provider: { ...provider, ...stored.provider, icon: provider.icon },
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

function mapApiJob(job: ApiJob, index: number): ProviderJob {
  const fallback = initialState.jobs[index % initialState.jobs.length];
  return {
    id: job.id,
    title: job.service_type,
    trade: job.trade_category.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    icon: fallback.icon,
    area: job.location_area,
    home: job.location_address,
    estimate: Math.round((job.estimated_value_min + job.estimated_value_max) / 2),
    distance: fallback.distance,
    issue: job.description,
    status: job.status === "open" ? "new" : job.status === "completed" ? "completed" : "active",
    competitorPrice: job.competitor_amount,
  };
}

function mapSupplier(supplier: ApiSupplier, currentProvider: typeof provider) {
  return {
    ...currentProvider,
    name: supplier.full_name,
    plan: supplier.plan,
    rating: supplier.rating,
    revealsLeft: supplier.reveals_remaining,
    services: [supplier.trade],
    icon: provider.icon,
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
    translatedBody: message.translated_body,
    language: message.language,
    createdAt: message.created_at,
  };
}

function mapApiEarnings(data: ApiEarnings): EarningsState {
  return {
    week: data.summary.this_week,
    month: data.summary.this_month,
    total: data.summary.total,
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

function mapActiveJobs(jobs: Array<ApiJob & { quote?: any }>): ActiveJob[] {
  return jobs.map((job) => ({
    id: job.id,
    title: job.service_type,
    customer: "MyKeyz customer",
    area: job.location_area,
    price: Number(job.quote?.amount ?? Math.round((job.estimated_value_min + job.estimated_value_max) / 2)),
    when: job.quote?.availability ?? "Awaiting customer",
    status: job.status === "completed" ? "Completed" : job.status === "in_progress" ? "Confirmed" : "Quoted",
    completed: job.status === "completed",
  }));
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
    case "setSupplier":
      return {
        ...state,
        supplierId: action.supplier.id,
        phone: action.supplier.phone,
        selectedAreas: action.supplier.coverage_areas.length ? action.supplier.coverage_areas : state.selectedAreas,
        selectedTradeKeys: action.supplier.trade ? [action.supplier.trade] : state.selectedTradeKeys,
        businessName: action.supplier.full_name,
        accountHolder: action.supplier.full_name,
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
    case "updateBusiness":
      return {
        ...state,
        businessName: action.businessName,
        tradeLicenseNumber: action.tradeLicenseNumber,
      };
    case "updateBank":
      return {
        ...state,
        bankIban: action.bankIban,
        accountHolder: action.accountHolder,
      };
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
        quotesSent: alreadyQuoted ? state.quotesSent : state.quotesSent + 1,
        sentQuotes: [quote, ...state.sentQuotes.filter((item) => item.jobId !== action.jobId)],
        jobs: state.jobs.map((job) =>
          job.id === action.jobId ? { ...job, status: "quoted", quote: action.amount } : job,
        ),
      };
    }
    case "revealPrice":
      if (state.revealedJobIds.includes(action.jobId)) return state;
      if (state.revealCredits <= 0) return state;
      return {
        ...state,
        revealCredits: state.revealCredits - 1,
        revealedJobIds: [...state.revealedJobIds, action.jobId],
      };
    case "setRevealCredits":
      return { ...state, revealCredits: action.amount };
    case "buyCredits":
      return {
        ...state,
        revealCredits: state.revealCredits + action.amount,
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
  requestOtp: (phone: string) => Promise<{ expires_in: number; dev_code?: string }>;
  signIn: (phone: string, code: string) => Promise<ApiSupplier>;
  logout: () => Promise<void>;
  toggleTrade: (tradeKey: string) => void;
  toggleArea: (area: string) => void;
  updateBusiness: (businessName: string, tradeLicenseNumber: string) => void;
  updateBank: (bankIban: string, accountHolder: string) => void;
  sendQuote: (jobId: string, amount: number) => void;
  revealPrice: (jobId: string) => boolean;
  buyCredits: (amount: number) => void;
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
    const [supplier, jobs, supplierJobs, earningsResult, conversationsResult] = await Promise.all([
      getSupplier(),
      listJobs(),
      listSupplierJobs(),
      getEarnings(),
      listConversations(),
    ]);
    dispatch({ type: "setSupplier", supplier });
    dispatch({ type: "setJobs", jobs: jobs.jobs.map(mapApiJob) });
    dispatch({ type: "setActiveJobs", jobs: mapActiveJobs(supplierJobs.jobs) });
    dispatch({ type: "setEarnings", earnings: mapApiEarnings(earningsResult) });
    dispatch({ type: "setConversations", conversations: conversationsResult.conversations.map(mapApiConversation) });
  }, []);

  // On boot, restore a persisted session and hydrate from the API. Never auto-logs-in.
  useEffect(() => {
    initSession()
      .then(() => {
        if (hasSession()) return loadAll();
      })
      .catch(() => undefined);
  }, [loadAll]);

  const revealPrice = useCallback(
    (jobId: string) => {
      if (state.revealedJobIds.includes(jobId)) return true;
      if (state.revealCredits <= 0) return false;
      dispatch({ type: "revealPrice", jobId });
      ensureSession()
        .then(() => apiRevealPrice(jobId))
        .then((result) => dispatch({ type: "setRevealCredits", amount: result.reveals_remaining }))
        .catch(() => undefined);
      trackEvent("price_revealed", { jobId });
      return true;
    },
    [state.phone, state.revealCredits, state.revealedJobIds],
  );

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      completeSetup: () => dispatch({ type: "completeSetup" }),
      setLanguage: (language) => dispatch({ type: "setLanguage", language }),
      setPhone: (phone) => dispatch({ type: "setPhone", phone }),
      requestOtp: (phone) => apiRequestOtp(phone),
      signIn: async (phone, code) => {
        const result = await apiVerifyOtp(phone, code);
        dispatch({ type: "setSupplier", supplier: result.supplier });
        dispatch({ type: "setPhone", phone: result.supplier.phone });
        await loadAll().catch(() => undefined);
        return result.supplier;
      },
      logout: async () => {
        await apiLogout();
        dispatch({ type: "reset" });
      },
      toggleTrade: (tradeKey) => dispatch({ type: "toggleTrade", tradeKey }),
      toggleArea: (area) => dispatch({ type: "toggleArea", area }),
      updateBusiness: (businessName, tradeLicenseNumber) =>
        {
          dispatch({ type: "updateBusiness", businessName, tradeLicenseNumber });
          ensureSession()
            .then(() => apiUpdateSupplier({ full_name: businessName }))
            .then((supplier) => dispatch({ type: "setSupplier", supplier }))
            .catch(() => undefined);
        },
      updateBank: (bankIban, accountHolder) => dispatch({ type: "updateBank", bankIban, accountHolder }),
      sendQuote: (jobId, amount) => {
        dispatch({ type: "sendQuote", jobId, amount });
        ensureSession()
          .then(() => submitQuote(jobId, amount))
          .catch(() => undefined);
        trackEvent("quote_sent", { jobId, amount });
      },
      revealPrice,
      buyCredits: (amount) => dispatch({ type: "buyCredits", amount }),
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
          .then((publicUrl) => dispatch({ type: "addGalleryImage", uri: publicUrl }))
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
          const saved = await apiSendMessage(conversationId, body, state.language);
          dispatch({ type: "appendMessage", conversationId, message: mapApiMessage(saved) });
        } catch {
          undefined;
        }
      },
      resetApp: () => dispatch({ type: "reset" }),
    }),
    [revealPrice, state, loadAll],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) throw new Error("useAppState must be used within AppStateProvider");
  return value;
}
