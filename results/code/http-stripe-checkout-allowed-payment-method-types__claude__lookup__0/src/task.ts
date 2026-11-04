const STRIPE_API_BASE = "https://api.stripe.com";
// API version taken from the current Stripe docs for POST /v1/checkout/sessions.
const STRIPE_API_VERSION = "2026-10-28.endive";

export interface CheckoutSession {
  id: string;
  object: "checkout.session";
  url: string | null;
  status: string;
  payment_status: string;
  amount_total: number | null;
  currency: string | null;
  [key: string]: unknown;
}

export interface CreateCheckoutSessionOptions {
  secretKey: string;
  successUrl: string;
  cancelUrl: string;
  idempotencyKey?: string;
}

/**
 * Creates a Stripe-hosted Checkout Session for a one-time $20 payment,
 * restricted to card payments. Redirect the customer to the returned `url`.
 */
export async function createCheckoutSession(
  opts: CreateCheckoutSessionOptions,
): Promise<CheckoutSession> {
  const body = new URLSearchParams({
    mode: "payment",
    ui_mode: "hosted_page",
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "2000", // $20.00 in cents
    "line_items[0][price_data][product_data][name]": "One-time payment",
    "allowed_payment_method_types[0]": "card",
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

  const data = (await res.json()) as CheckoutSession & {
    error?: { message?: string; type?: string; code?: string };
  };

  if (!res.ok) {
    const err = data.error;
    throw new Error(
      `Stripe error ${res.status}${err?.type ? ` (${err.type})` : ""}: ${err?.message ?? "unknown error"}`,
    );
  }

  return data;
}
