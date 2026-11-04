const STRIPE_CHECKOUT_SESSIONS_URL = "https://api.stripe.com/v1/checkout/sessions";
const STRIPE_API_VERSION = "2026-10-28.endive";
const REQUEST_TIMEOUT_MS = 30_000;

export interface CreateCheckoutSessionOptions {
  /** Stripe secret key. Server-side only: never expose this to a browser. */
  secretKey: string;
  /** Absolute URL Stripe redirects to after a successful payment. */
  successUrl: string;
  /** Absolute URL for Checkout's back button. Omit to hide the button. */
  cancelUrl?: string;
  /** Name shown to the customer on the Checkout page. */
  productName?: string;
  /** Reuse the same key when retrying so a retry can't create a second session. */
  idempotencyKey?: string;
}

export interface CheckoutSession {
  id: string;
  /** Hosted Checkout page to redirect the customer to. */
  url: string;
}

/** Creates a Stripe-hosted Checkout Session for a one-time $20 USD card payment. */
export async function createCheckoutSession({
  secretKey,
  successUrl,
  cancelUrl,
  productName = "One-time payment",
  idempotencyKey,
}: CreateCheckoutSessionOptions): Promise<CheckoutSession> {
  const body = new URLSearchParams({
    mode: "payment",
    ui_mode: "hosted_page",
    success_url: successUrl,
    // Since 2026-09-30.endive, sending payment_method_types here returns a 400.
    "allowed_payment_method_types[0]": "card",
    "wallet_options[link][display]": "never",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "2000", // Amount in cents.
    "line_items[0][price_data][product_data][name]": productName,
  });
  if (cancelUrl !== undefined) {
    body.set("cancel_url", cancelUrl);
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
    "Stripe-Version": STRIPE_API_VERSION,
  };
  if (idempotencyKey !== undefined) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  const response = await fetch(STRIPE_CHECKOUT_SESSIONS_URL, {
    method: "POST",
    headers,
    body,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error?.message ?? "Unknown error";
    throw new Error(`Stripe request failed (${response.status}): ${message}`);
  }
  if (typeof data?.id !== "string" || typeof data?.url !== "string") {
    throw new Error("Stripe response is missing the session id or url");
  }

  return { id: data.id, url: data.url };
}
