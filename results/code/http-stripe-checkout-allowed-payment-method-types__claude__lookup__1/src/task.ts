const STRIPE_API_BASE = "https://api.stripe.com";
// API version the Checkout Session parameters below were checked against.
const STRIPE_API_VERSION = "2026-10-28.endive";

export interface CreateCheckoutSessionOptions {
  secretKey: string;
  successUrl: string;
  cancelUrl?: string;
  idempotencyKey?: string;
}

export interface CheckoutSession {
  id: string;
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
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "2000", // $20.00 in cents
    "line_items[0][price_data][product_data][name]": "One-time payment",
    // Filters the dynamically eligible payment methods down to card only.
    "allowed_payment_method_types[0]": "card",
  });
  if (opts.cancelUrl) body.set("cancel_url", opts.cancelUrl);

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
    url?: string;
    error?: { message?: string };
  };

  if (!res.ok || !data.id || !data.url) {
    throw new Error(
      `Stripe error (${res.status}): ${data.error?.message ?? "unexpected response"}`,
    );
  }

  return { id: data.id, url: data.url };
}
