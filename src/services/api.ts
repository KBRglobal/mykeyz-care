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
  service_type: string;
  trade_category: string;
  location_area: string;
  location_address: string;
  description: string;
  estimated_value_min: number;
  estimated_value_max: number;
  job_type: "instant" | "tender";
  status: "open" | "in_progress" | "completed";
  competitor_amount: number;
  created_at: string;
};

export type VerificationStatus = "draft" | "submitted" | "needs_changes" | "approved" | "rejected" | "suspended";

export type ApiSupplier = {
  id: string;
  phone: string;
  full_name: string;
  business_name: string;
  trade_license_number: string;
  preferred_language: string;
  trades: string[];
  coverage_areas: string[];
  rating: number;
  review_count: number;
  plan: string;
  reveals_remaining: number;
  verification_status: VerificationStatus;
  is_verified: boolean;
  is_onboarded: boolean;
  photo_url?: string;
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
  body: string;
  original_body?: string;
  translated_body?: string;
  language?: string;
  status: "sent" | "delivered" | "read";
  created_at: string;
};

export type ApiEarnings = {
  summary: { this_week: number; this_month: number; total: number };
  weekly_chart: { week_start: string; gross: number }[];
  transactions: { job_id: string; job_name: string; completed_at: string; gross_amount: number; commission: number; net_amount: number }[];
};

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

export async function requestOtp(phone: string, channel: "sms" | "whatsapp" = "sms") {
  return rawRequest<{ expires_in: number; dev_code?: string }>(
    "/api/v1/auth/request-otp",
    { method: "POST", body: JSON.stringify({ phone, channel }) },
    false,
  );
}

export async function verifyOtp(phone: string, code: string) {
  const result = await rawRequest<AuthSession>(
    "/api/v1/auth/verify-otp",
    { method: "POST", body: JSON.stringify({ phone, code }) },
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
  return request<{ jobs: ApiJob[]; total: number }>("/api/v1/jobs");
}

export async function getSupplier() {
  return request<ApiSupplier>("/api/v1/supplier/me");
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

export async function saveServiceAreas(areas: string[]) {
  return request<ApiSupplier>("/api/v1/supplier/me/service-areas", {
    method: "PUT",
    body: JSON.stringify({ areas }),
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

export async function getEarnings() {
  return request<ApiEarnings>("/api/v1/supplier/me/earnings");
}

export async function listConversations() {
  return request<{ conversations: ApiConversation[] }>("/api/v1/conversations");
}

export async function listMessages(conversationId: string) {
  return request<{ messages: ApiMessage[]; has_more: boolean }>(`/api/v1/conversations/${conversationId}/messages`);
}

export async function sendMessage(conversationId: string, body: string, language = "en") {
  return request<ApiMessage>(`/api/v1/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body, language }),
  });
}

export async function submitQuote(jobId: string, amount: number) {
  return request(`/api/v1/jobs/${jobId}/quotes`, {
    method: "POST",
    body: JSON.stringify({ amount, availability: "tomorrow", note: "Sent from MyKeyz Care" }),
  });
}

export async function revealPrice(jobId: string) {
  return request<{ revealed_amount: number; reveals_remaining: number }>(`/api/v1/jobs/${jobId}/reveals`, {
    method: "POST",
  });
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
