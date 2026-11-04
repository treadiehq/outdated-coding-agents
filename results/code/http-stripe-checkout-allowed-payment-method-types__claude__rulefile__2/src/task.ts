const STRIPE_API_BASE = "https://api.stripe.com";
// API version used in Stripe's current Checkout Sessions reference.
const STRIPE_API_VERSION = "2026-10-28.endive";

export interface CreateCheckoutSessionOptions {
  /** Stripe secret key (sk_test_... / sk_live_...). Keep server-side only. */
  secretKey: string;
  /** Where Stripe redirects after successful payment. */
  successUrl: string;
  /** Where Stripe sends customers who click the back button. */
  cancelUrl: string;
  /** Optional idempotency key so retries don't create duplicate sessions. */
  idempotencyKey?: string;
}

export interface CheckoutSession {
  id: string;
  /** Hosted Checkout page to redirect the customer to. */
  url: string;
}

/** Creates a hosted Checkout Session for a one-time $20 payment, card only. */
export async function createCheckoutSession(
  opts: CreateCheckoutSessionOptions,
): Promise<CheckoutSession> {
  const body = new URLSearchParams({
    mode: "payment",
    ui_mode: "hosted_page",
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    "allowed_payment_method_types[0]": "card",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "2000", // $20.00 in cents
    "line_items[0][price_data][product_data][name]": "One-time payment",
  });

  const headers: Record<string, string> = {
    Authorization: `Bearer ${opts.secretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
    "Stripe-Version": STRIPE_API_VERSION,
  };
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;

  const res = await fetch(`${STRIPE_API_BASE}/v1/checkout/sessions`, {
    method: "POST",
    headers,
    body,
  });

  const data = (await res.json()) as {
    id?: string;
    url?: string | null;
    error?: { message?: string; type?: string; code?: string };
  };

  if (!res.ok) {
    throw new Error(
      `Stripe error (${res.status}): ${data.error?.message ?? res.statusText}`,
    );
  }
  if (!data.id || !data.url) {
    throw new Error("Stripe response missing session id or url");
  }

  return { id: data.id, url: data.url };
}
