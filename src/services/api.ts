import { clearSession, loadSession, saveSession } from "./session";

const API_URLS = [
  process.env.EXPO_PUBLIC_API_URL ?? "https://care-api.mykeyz.io",
  "https://mykeyz-care-api-production.up.railway.app",
];

let accessToken: string | null = null;
let refreshToken: string | null = null;
let initialized = false;

export type ApiJob = {
  id: string;
  source: "inspection" | "care_hub" | "admin";
  service_type: string;
  trade_category: string;
  location_area: string;
  location_address: string;
  description: string;
  estimated_value_min: number;
  estimated_value_max: number;
  job_type: "instant" | "tender";
  status: "open" | "assigned" | "in_progress" | "completed" | "expired";
  selected_quote_id: string | null;
  // Server-authoritative: null until THIS provider holds an authorized reveal for
  // this exact job, then the real budget; competitor_amount_revealed flags which.
  competitor_amount: number | null;
  competitor_amount_revealed: boolean;
  quote_deadline: string | null;
  created_at: string;
  updated_at?: string;
  // Present on the /jobs feed (matched jobs) — optional on the shared shape.
  rank_score?: number;
  has_quoted?: boolean;
};

export type QuoteStatusApi = "pending" | "shortlisted" | "won" | "lost" | "withdrawn";

export type ApiQuote = {
  id: string;
  job_id?: string;
  amount: number;
  availability?: string;
  available_date?: string | null;
  note?: string;
  status: QuoteStatusApi;
};

export type ApiJobFinding = {
  id: string;
  job_id: string;
  room: string;
  finding_type: string;
  description: string;
  severity: "low" | "medium" | "high";
  photo_url: string | null;
  created_at: string;
};

export type ApiJobDetail = {
  job: ApiJob;
  findings: ApiJobFinding[];
  inspection_insight: { available: boolean; defects: ApiJobFinding[] };
  quote_count: number;
  my_quote: ApiQuote | null;
  is_winner: boolean;
  can_quote: boolean;
};

export type VerificationStatus = "draft" | "submitted" | "needs_changes" | "approved" | "rejected" | "suspended";

export type ApiSupplier = {
  id: string;
  phone: string | null;
  email: string | null;
  full_name: string;
  business_name: string;
  trade_license_number: string;
  preferred_language: string;
  trades: string[];
  coverage_areas: string[];
  covers_all_dubai: boolean;
  rating: number;
  review_count: number;
  plan: string;
  reveals_remaining: number;
  verification_status: VerificationStatus;
  is_verified: boolean;
  is_onboarded: boolean;
  photo_url?: string;
};

// ---- Plans & entitlement (Sprint 9, SERVER-AUTHORITATIVE) ----

/**
 * A catalog plan tier as the server defines it. The client NEVER decides price,
 * included reveals, or ranking weight — it only renders what /api/v1/plans returns.
 */
export type SubscriptionPlan = {
  tier: string;
  price_aed: number;
  included_reveals: number;
  ranking_weight: number;
  active: boolean;
};

/**
 * The provider's live entitlement. This is SERVER TRUTH — plan + reveals_remaining are
 * granted ONLY by a validated Apple/Google IAP and can never be set by the client.
 * `subscription` is null when the provider has no active paid plan (free/minimal tier).
 */
export type Entitlement = {
  plan: string;
  reveals_remaining: number;
  ranking_weight: number;
  subscription: { status: string; expires_at: string | null; store: string } | null;
};

export type ApiSupplierDocument = {
  id: string;
  supplier_id: string;
  type: string;
  public_url: string;
  storage_key: string;
  status: string;
  created_at: string;
};

export type ApiConversation = {
  id: string;
  job_id: string;
  supplier_id: string;
  customer_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
};

export type ApiMessage = {
  id: string;
  conversation_id: string;
  sender_type: "supplier" | "customer";
  sender_id: string;
  // Masked '•••' span when flagged — the RAW excerpt is NEVER returned here.
  body: string;
  // = stored (already-masked) body; the raw is kept only in leakage_evidence.
  original_body?: string;
  // Translation of the stored body into the recipient language (pass-through when translation is off).
  translated_body?: string;
  language?: string;
  recipient_language?: string;
  flagged?: boolean;
  masked?: boolean;
  moderation_status?: "clean" | "flagged";
  status: "sent" | "delivered" | "read";
  created_at: string;
};

/** Outbound-message moderation verdict returned alongside the stored message. */
export type Moderation = { flagged: boolean; masked: boolean; warning: string | null };

export type SendMessageResult =
  | { ok: true; message: ApiMessage; moderation: Moderation }
  | { ok: false; error: string };

/**
 * Sprint 8 ledger-derived earnings (GET /api/v1/supplier/me/earnings).
 * BUSINESS MODEL: money flows OUTSIDE the platform — the customer pays the provider
 * directly (gross). `commission_owed` is the lead commission the PROVIDER OWES MyKeyz
 * (an amount-owed ledger, collected later via in-app store). The platform never pays
 * the provider; net = gross - commission = "you keep". No bank/IBAN/payout anywhere.
 */
export type SupplierEarnings = {
  summary: {
    this_week: number;
    this_month: number;
    total_gross: number;
    total_net: number;
    commission_owed: number;
  };
  weekly_chart: { week_start: string; gross: number }[];
  transactions: { job_id: string; job_name: string; completed_at: string; gross_amount: number; commission: number; net_amount: number }[];
};

/** @deprecated Use {@link SupplierEarnings}. Alias retained for existing imports. */
export type ApiEarnings = SupplierEarnings;

type AuthSession = { token: string; refresh_token: string; supplier: ApiSupplier };

/** Load any persisted tokens into memory. Safe to call multiple times. */
export async function initSession() {
  if (initialized) return;
  const stored = await loadSession();
  if (stored) {
    accessToken = stored.accessToken;
    refreshToken = stored.refreshToken;
  }
  initialized = true;
}

export function hasSession() {
  return Boolean(accessToken || refreshToken);
}

async function applySession(session: { token: string; refresh_token: string }) {
  accessToken = session.token;
  refreshToken = session.refresh_token;
  await saveSession({ accessToken: session.token, refreshToken: session.refresh_token });
}

async function dropSession() {
  accessToken = null;
  refreshToken = null;
  await clearSession();
}

async function rawRequest<T>(path: string, options: RequestInit, withAuth: boolean): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("content-type", "application/json");
  if (withAuth && accessToken) headers.set("authorization", `Bearer ${accessToken}`);
  let lastError: Error | null = null;
  for (const apiUrl of API_URLS) {
    try {
      const response = await fetch(`${apiUrl}${path}`, { ...options, headers });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(typeof body?.error === "string" ? body.error : `api_${response.status}`);
        (error as Error & { status?: number }).status = response.status;
        lastError = error;
        if (response.status !== 404) throw error;
        continue;
      }
      return body as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("api_request_failed");
      if ((lastError as Error & { status?: number }).status && (lastError as Error & { status?: number }).status !== 404) {
        throw lastError;
      }
    }
  }
  throw lastError ?? new Error("api_request_failed");
}

/** Exchange the refresh token for a fresh access/refresh pair. Returns false if it cannot. */
async function tryRefresh(): Promise<boolean> {
  if (!refreshToken) return false;
  try {
    const next = await rawRequest<{ token: string; refresh_token: string }>(
      "/api/v1/auth/refresh",
      { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) },
      false,
    );
    await applySession(next);
    return true;
  } catch {
    await dropSession();
    return false;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  await initSession();
  try {
    return await rawRequest<T>(path, options, true);
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    if (status === 401 && (await tryRefresh())) {
      return rawRequest<T>(path, options, true);
    }
    throw error;
  }
}

// ---- Auth ----

// Care's temporary login channel is email (codes delivered via Resend). Phone delivery comes later;
// the backend still accepts a `phone` identifier, so reinstating phone here is a one-line change.
export async function requestOtp(email: string) {
  return rawRequest<{ expires_in: number; dev_code?: string }>(
    "/api/v1/auth/request-otp",
    { method: "POST", body: JSON.stringify({ email, channel: "email" }) },
    false,
  );
}

export async function verifyOtp(email: string, code: string) {
  const result = await rawRequest<AuthSession>(
    "/api/v1/auth/verify-otp",
    { method: "POST", body: JSON.stringify({ email, code }) },
    false,
  );
  await applySession(result);
  return result;
}

export async function logout() {
  await initSession();
  if (refreshToken) {
    await rawRequest("/api/v1/auth/logout", { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) }, false).catch(
      () => undefined,
    );
  }
  await dropSession();
}

/** Resolve when a usable session exists; throw "no_session" otherwise. Never auto-logs-in. */
export async function ensureSession() {
  await initSession();
  if (accessToken) return;
  if (await tryRefresh()) return;
  throw new Error("no_session");
}

// ---- Resources ----

export async function listJobs() {
  return request<{ jobs: ApiJob[]; total: number; page?: number }>("/api/v1/jobs");
}

export async function getJobDetail(jobId: string) {
  return request<ApiJobDetail>(`/api/v1/jobs/${jobId}`);
}

export async function getSupplier() {
  return request<ApiSupplier>("/api/v1/supplier/me");
}

/** The plan catalog. The server is the only authority on tiers, prices, and reveals. */
export async function getPlans() {
  return request<{ data: SubscriptionPlan[] }>("/api/v1/plans");
}

/**
 * The provider's live, server-authoritative entitlement (plan + reveals_remaining).
 * This is the ONLY source of truth for the current tier — never infer it client-side.
 */
export async function getEntitlement() {
  return request<Entitlement>("/api/v1/supplier/me/entitlement");
}

export async function updateSupplier(payload: {
  full_name?: string;
  business_name?: string;
  trade_license_number?: string;
  photo_url?: string;
}) {
  return request<ApiSupplier>("/api/v1/supplier/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function saveTrades(trades: string[]) {
  return request<ApiSupplier>("/api/v1/supplier/me/trades", {
    method: "PUT",
    body: JSON.stringify({ trades }),
  });
}

export async function saveServiceAreas(areas: string[], allDubai = false) {
  return request<ApiSupplier>("/api/v1/supplier/me/service-areas", {
    method: "PUT",
    body: JSON.stringify({ areas, all_dubai: allDubai }),
  });
}

export async function saveLanguage(language: string) {
  return request<ApiSupplier>("/api/v1/supplier/me/language", {
    method: "PUT",
    body: JSON.stringify({ language }),
  });
}

export async function addDocument(type: string, publicUrl: string, storageKey: string) {
  return request<ApiSupplierDocument>("/api/v1/supplier/me/documents", {
    method: "POST",
    body: JSON.stringify({ type, public_url: publicUrl, storage_key: storageKey }),
  });
}

export async function submitVerification() {
  return request<ApiSupplier>("/api/v1/supplier/me/verification-submit", { method: "POST" });
}

export async function getVerification() {
  return request<{ verification_status: VerificationStatus; reason: string | null }>("/api/v1/supplier/me/verification");
}

export async function completeOnboarding() {
  return request<ApiSupplier>("/api/v1/supplier/me/onboarding", { method: "PUT" });
}

export async function listSupplierJobs() {
  return request<{ jobs: Array<ApiJob & { quote?: unknown }>; total: number }>("/api/v1/supplier/me/jobs");
}

/** Ledger-derived supplier earnings. Standard request (throws on hard failure). */
export async function getEarnings() {
  return request<SupplierEarnings>("/api/v1/supplier/me/earnings");
}

export async function listConversations() {
  return request<{ conversations: ApiConversation[] }>("/api/v1/conversations");
}

export async function listMessages(conversationId: string) {
  return request<{ messages: ApiMessage[]; has_more: boolean }>(`/api/v1/conversations/${conversationId}/messages`);
}

/**
 * Posts a supplier message. The server runs the leakage detector on this OUTBOUND
 * text and returns the stored (possibly masked) message PLUS a moderation verdict.
 * Never throws — branch on the result; the RAW excerpt is never returned here.
 */
export async function sendMessage(conversationId: string, body: string, language = "en"): Promise<SendMessageResult> {
  try {
    const result = await request<ApiMessage & { moderation?: Moderation }>(
      `/api/v1/conversations/${conversationId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ body, language }),
      },
    );
    const { moderation, ...message } = result;
    return {
      ok: true,
      message,
      moderation: moderation ?? { flagged: false, masked: false, warning: null },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "request_failed";
    return { ok: false, error: message };
  }
}

export type SubmitQuoteResult =
  | { ok: true; status: number; quote: unknown }
  | { ok: false; status: number; error: string };

/**
 * Posts a quote. Never throws — returns a result the caller can branch on so it
 * can detect 403 not_verified / not_matched, 409 job_closed / already_quoted, etc.
 * The server's error body (`error` field) is preserved on `result.error`.
 */
export async function submitQuote(
  jobId: string,
  amount: number,
  extra?: { availability?: string; available_date?: string; note?: string },
): Promise<SubmitQuoteResult> {
  try {
    const quote = await request(`/api/v1/jobs/${jobId}/quotes`, {
      method: "POST",
      body: JSON.stringify({
        amount,
        availability: extra?.availability ?? "tomorrow",
        ...(extra?.available_date ? { available_date: extra.available_date } : {}),
        note: extra?.note ?? "Sent from MyKeyz Care",
      }),
    });
    return { ok: true, status: 201, quote };
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 0;
    const message = error instanceof Error ? error.message : "request_failed";
    return { ok: false, status, error: message };
  }
}

export type QuoteMutationResult =
  | { ok: true; status: number; quote: ApiQuote }
  | { ok: false; status: number; error: string };

/**
 * Edits the supplier's own pending quote. Never throws — branch on the result.
 * 409 `edit_window_closed` when the quote is no longer editable (non-pending,
 * job closed, or past deadline); 404 `not_found`.
 */
export async function editQuote(
  jobId: string,
  quoteId: string,
  patch: { amount?: number; availability?: string; available_date?: string; note?: string },
): Promise<QuoteMutationResult> {
  try {
    const quote = await request<ApiQuote>(`/api/v1/jobs/${jobId}/quotes/${quoteId}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    return { ok: true, status: 200, quote };
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 0;
    const message = error instanceof Error ? error.message : "request_failed";
    return { ok: false, status, error: message };
  }
}

/**
 * Withdraws the supplier's own pending quote. Never throws — branch on the result.
 * 409 `not_withdrawable` when the quote can no longer be withdrawn; 404 `not_found`.
 */
export async function withdrawQuote(jobId: string, quoteId: string): Promise<QuoteMutationResult> {
  try {
    const quote = await request<ApiQuote>(`/api/v1/jobs/${jobId}/quotes/${quoteId}/withdraw`, {
      method: "POST",
    });
    return { ok: true, status: 200, quote };
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 0;
    const message = error instanceof Error ? error.message : "request_failed";
    return { ok: false, status, error: message };
  }
}

// ---- Reveal ledger (Sprint 6, server-authoritative + auditable) ----

export type RevealEventType = "plan_grant" | "reveal_debit" | "purchase";

export type RevealEvent = {
  id: string;
  supplier_id: string;
  job_id: string | null;
  type: RevealEventType;
  delta: number;
  balance_after: number;
  reason: string;
  plan: string | null;
  iap_product_id: string | null;
  created_at: string;
};

/** The ONLY source of truth for the reveal balance — never compute it client-side. */
export type RevealWallet = {
  reveals_remaining: number;
  granted_total: number;
  debited_total: number;
  purchased_total: number;
  events: RevealEvent[];
};

export type RevealResult =
  | { ok: true; status: number; revealed_amount: number; charged_credits: boolean; reveals_remaining: number; wallet: RevealWallet }
  | { ok: false; status: number; error: string; iap_product_id: string | null };

/**
 * Reveals the competitor's budget for a job. Never throws — branch on the result.
 * 201 -> { revealed_amount, charged_credits, reveals_remaining, wallet }. Re-revealing an
 * already-revealed job returns charged_credits:false and writes NO new debit. A 402
 * (`no_credits`) means the wallet is empty — offer the single-reveal placeholder purchase.
 */
export async function revealJobBudget(jobId: string): Promise<RevealResult> {
  try {
    const result = await request<{
      revealed_amount: number;
      charged_credits: boolean;
      reveals_remaining: number;
      wallet: RevealWallet;
    }>(`/api/v1/jobs/${jobId}/reveals`, { method: "POST" });
    return { ok: true, status: 201, ...result };
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 0;
    const message = error instanceof Error ? error.message : "request_failed";
    // The 402 body carries iap_product_id:'care_reveal_single'; the contract fixes it.
    return { ok: false, status, error: message, iap_product_id: status === 402 ? "care_reveal_single" : null };
  }
}

/** The full reveal wallet (balance + last 50 audit events). Server number only. */
export async function getReveals() {
  return request<RevealWallet>("/api/v1/supplier/me/reveals");
}

// ---- IAP receipt validation (Sprint 9, Apple/Google ONLY — no cards, no bank) ----

/**
 * Result of submitting a store receipt to the server for validation. Never throws —
 * branch on the result. 200 -> fresh {@link Entitlement} (benefits applied server-side).
 * 400 `invalid_receipt` / `unknown_product`; 409 `already_processed` on a replay of the
 * same store transaction (grants nothing — refetch the entitlement to show server truth).
 */
export type IapPurchaseResult =
  | { ok: true; status: number; entitlement: Entitlement }
  | { ok: false; status: number; error: string };

/**
 * Validate an Apple App Store transaction. The server decodes the signed JWS, maps the
 * product_id (care_plan_standard/premium -> plan, care_reveal_single -> +1 reveal), and
 * applies the benefit SERVER-SIDE. The client passes the store receipt only — it never
 * grants itself a plan or reveals.
 */
export async function submitApplePurchase(signedTransaction: string): Promise<IapPurchaseResult> {
  try {
    const entitlement = await request<Entitlement>("/api/v1/supplier/me/iap/apple", {
      method: "POST",
      body: JSON.stringify({ signed_transaction: signedTransaction }),
    });
    return { ok: true, status: 200, entitlement };
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 0;
    const message = error instanceof Error ? error.message : "request_failed";
    return { ok: false, status, error: message };
  }
}

/** Validate a Google Play purchase. Parity route to {@link submitApplePurchase}. */
export async function submitGooglePurchase(purchaseToken: string, productId: string): Promise<IapPurchaseResult> {
  try {
    const entitlement = await request<Entitlement>("/api/v1/supplier/me/iap/google", {
      method: "POST",
      body: JSON.stringify({ purchase_token: purchaseToken, product_id: productId }),
    });
    return { ok: true, status: 200, entitlement };
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 0;
    const message = error instanceof Error ? error.message : "request_failed";
    return { ok: false, status, error: message };
  }
}

export async function completeJob(jobId: string) {
  return request<{ ok: boolean }>(`/api/v1/jobs/${jobId}/complete`, {
    method: "POST",
  });
}

export async function uploadFile(uri: string, fileType: "profile_photo" | "trade_license" | "work_photo", contentType = "image/jpeg") {
  const presign = await request<{ upload_url: string; public_url: string; file_key: string; mode: string }>("/api/v1/upload/presign", {
    method: "POST",
    body: JSON.stringify({ file_type: fileType, content_type: contentType }),
  });
  const file = await fetch(uri);
  const blob = await file.blob();
  const response = await fetch(presign.upload_url, {
    method: "PUT",
    headers: { "content-type": contentType },
    body: blob,
  });
  if (!response.ok) throw new Error(`upload_${response.status}`);
  return { public_url: presign.public_url, storage_key: presign.file_key };
}
