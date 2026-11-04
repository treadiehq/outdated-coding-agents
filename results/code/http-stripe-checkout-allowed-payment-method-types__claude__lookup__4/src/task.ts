const STRIPE_API_BASE = "https://api.stripe.com";
// API version used by the current Checkout Sessions reference docs.
const STRIPE_API_VERSION = "2026-10-28.endive";

export interface CreateCheckoutSessionOptions {
  secretKey: string;
  successUrl: string;
  cancelUrl: string;
  idempotencyKey?: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
}

/**
 * Creates a Stripe-hosted Checkout Session for a one-time $20 payment,
 * restricted to card payments. Returns the session id and the hosted page URL
 * to redirect the customer to.
 */
export async function createCheckoutSession(
  opts: CreateCheckoutSessionOptions,
): Promise<CheckoutSession> {
  const body = new URLSearchParams({
    mode: "payment",
    ui_mode: "hosted_page",
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    // Filters the eligible payment methods down to card only.
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
    error?: { message?: string };
  };

  if (!res.ok || !data.id || !data.url) {
    throw new Error(
      `Stripe Checkout Session creation failed (${res.status}): ${
        data.error?.message ?? "unexpected response"
      }`,
    );
  }

  return { id: data.id, url: data.url };
}
