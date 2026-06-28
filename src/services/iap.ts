// Real in-app purchases via expo-iap (StoreKit 2 on iOS, Play Billing on Android).
//
// expo-iap is a NATIVE module: it only works in a dev/production build that bundled it. We load it
// lazily inside try/catch and guard every call, so a JS context without the native module (Expo Go,
// or an older binary that received this code over OTA) degrades to { ok:false, error:'store_unavailable' }
// instead of crashing. The SERVER remains the sole authority on every benefit — we only hand it the
// store's signed transaction (purchase.purchaseToken = the iOS JWS) for verification.

type IapModule = typeof import("expo-iap");

let mod: IapModule | null | undefined;
let connected = false;
// The most recent successful purchase object, kept so finishPurchase() can settle it AFTER the
// server validates. iOS will keep re-delivering an unfinished transaction until it is finished.
let lastPurchase: unknown = null;

async function load(): Promise<IapModule | null> {
  if (mod !== undefined) return mod;
  try {
    mod = await import("expo-iap");
  } catch {
    mod = null;
  }
  return mod;
}

function isSubscription(productId: string): boolean {
  return productId.startsWith("care_plan");
}

export type IapResult = { ok: true; token: string } | { ok: false; error: string };

// Present the native store sheet for productId and resolve with the signed transaction token.
export async function purchase(productId: string): Promise<IapResult> {
  const iap = await load();
  if (!iap) return { ok: false, error: "store_unavailable" };
  const sub = isSubscription(productId);
  try {
    if (!connected) {
      await iap.initConnection();
      connected = true;
    }
    // StoreKit requires products to be fetched before they can be purchased.
    await iap.fetchProducts({ skus: [productId], type: sub ? "subs" : "in-app" });
  } catch {
    return { ok: false, error: "store_init_failed" };
  }

  return new Promise<IapResult>((resolve) => {
    let settled = false;
    let okSub: { remove: () => void } | null = null;
    let errSub: { remove: () => void } | null = null;
    const cleanup = () => {
      try { okSub?.remove(); } catch { /* noop */ }
      try { errSub?.remove(); } catch { /* noop */ }
    };
    const settle = (r: IapResult) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(r);
    };

    okSub = iap.purchaseUpdatedListener((p) => {
      const token = p?.purchaseToken;
      if (!token) return settle({ ok: false, error: "no_token" });
      lastPurchase = p;
      settle({ ok: true, token });
    });
    errSub = iap.purchaseErrorListener((err) => settle({ ok: false, error: err?.code ?? "purchase_failed" }));

    const requestProps = { apple: { sku: productId }, google: { skus: [productId] } };
    const args: Parameters<typeof iap.requestPurchase>[0] = sub
      ? { request: requestProps, type: "subs" }
      : { request: requestProps, type: "in-app" };
    Promise.resolve(iap.requestPurchase(args)).catch(() => settle({ ok: false, error: "request_failed" }));
  });
}

// Settle the StoreKit transaction once the server has applied the benefit. Safe to call always.
export async function finishPurchase(productId: string): Promise<void> {
  const iap = await load();
  if (!iap || !lastPurchase) return;
  try {
    await iap.finishTransaction({ purchase: lastPurchase as never, isConsumable: !isSubscription(productId) });
  } catch {
    /* a failed finish just means iOS re-delivers it next launch — never fatal */
  } finally {
    lastPurchase = null;
  }
}
