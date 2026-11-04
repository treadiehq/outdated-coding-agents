const STRIPE_CHECKOUT_SESSIONS_URL = "https://api.stripe.com/v1/checkout/sessions";

export interface CreateCheckoutSessionOptions {
  /** Stripe secret key (sk_test_... or sk_live_...). Only use this on the server. */
  apiKey: string;
  /** Where Stripe redirects after payment. May include {CHECKOUT_SESSION_ID}. */
  successUrl: string;
  /** Where Stripe redirects if the customer backs out of the payment. */
  cancelUrl: string;
  /** Name shown to the customer on the hosted payment page. */
  productName?: string;
  /** Reuse the same key when retrying so a retry can't create a second session. */
  idempotencyKey?: string;
}

export interface CheckoutSession {
  id: string;
  /** Hosted payment page to redirect the customer to. */
  url: string;
}

/** Creates a hosted Stripe Checkout Session for a one-time, card-only $20 payment. */
export async function createCheckoutSession({
  apiKey,
  successUrl,
  cancelUrl,
  productName = "One-time payment",
  idempotencyKey,
}: CreateCheckoutSessionOptions): Promise<CheckoutSession> {
  // Stripe's REST API takes form-encoded bodies, not JSON.
  const body = new URLSearchParams({
    mode: "payment",
    "payment_method_types[0]": "card",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "2000", // In cents.
    "line_items[0][price_data][product_data][name]": productName,
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  const response = await fetch(STRIPE_CHECKOUT_SESSIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body,
  });

  // Stripe error responses are normally JSON, but a proxy or outage may return something else.
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error?.message ?? "Unknown error";
    throw new Error(`Stripe API error (${response.status}): ${message}`);
  }

  if (!data?.id || !data?.url) {
    throw new Error("Stripe API returned a Checkout Session without an id or url");
  }

  return { id: data.id, url: data.url };
}
