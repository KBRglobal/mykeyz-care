const API_URLS = [
  process.env.EXPO_PUBLIC_API_URL ?? "https://care-api.mykeyz.io",
  "https://mykeyz-care-api-production.up.railway.app",
];

let authToken: string | null = null;

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

export type ApiSupplier = {
  id: string;
  phone: string;
  full_name: string;
  trade: string;
  coverage_areas: string[];
  rating: number;
  review_count: number;
  plan: string;
  reveals_remaining: number;
  is_verified: boolean;
  is_onboarded: boolean;
  photo_url?: string;
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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("content-type", "application/json");
  if (authToken) headers.set("authorization", `Bearer ${authToken}`);
  let lastError: Error | null = null;
  for (const apiUrl of API_URLS) {
    try {
      const response = await fetch(`${apiUrl}${path}`, { ...options, headers });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        lastError = new Error(typeof body?.error === "string" ? body.error : `api_${response.status}`);
        if (response.status !== 404) throw lastError;
        continue;
      }
      return body as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("api_request_failed");
    }
  }
  throw lastError ?? new Error("api_request_failed");
}

export async function verifyOtp(phone: string, code = "123456") {
  const result = await request<{ token: string; supplier: unknown }>("/api/v1/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ phone, code }),
  });
  authToken = result.token;
  return result;
}

export async function listJobs() {
  return request<{ jobs: ApiJob[]; total: number }>("/api/v1/jobs");
}

export async function getSupplier() {
  return request<ApiSupplier>("/api/v1/supplier/me");
}

export async function updateSupplier(payload: Partial<ApiSupplier>) {
  return request<ApiSupplier>("/api/v1/supplier/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
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
  const presign = await request<{ upload_url: string; public_url: string; mode: string }>("/api/v1/upload/presign", {
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
  return presign.public_url;
}

export async function ensureSession(phone: string) {
  if (authToken) return;
  await verifyOtp(phone || "+971501234567");
}
