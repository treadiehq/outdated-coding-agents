const STRIPE_CHECKOUT_SESSIONS_URL = "https://api.stripe.com/v1/checkout/sessions";

export interface CreateCheckoutSessionOptions {
  /** Stripe secret key (sk_test_... or sk_live_...). Only use this server-side. */
  apiKey: string;
  /** Where Stripe redirects after a successful payment. */
  successUrl: string;
  /** Where Stripe redirects if the customer abandons checkout. */
  cancelUrl: string;
  /** Pass a stable value per purchase attempt so retries can't create duplicate sessions. */
  idempotencyKey?: string;
}

export interface CheckoutSession {
  id: string;
  /** Hosted Checkout page to redirect the customer to. */
  url: string;
}

/** Creates a hosted Checkout Session for a one-time $20 USD payment, card only. */
export async function createCheckoutSession(
  options: CreateCheckoutSessionOptions,
): Promise<CheckoutSession> {
  const { apiKey, successUrl, cancelUrl, idempotencyKey } = options;

  // Stripe's REST API takes form-encoded bodies, not JSON.
  const body = new URLSearchParams({
    mode: "payment",
    "allowed_payment_method_types[0]": "card",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "2000", // In cents.
    "line_items[0][price_data][product_data][name]": "One-time payment",
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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Stripe API error (${response.status}): ${data?.error?.message ?? "Unknown error"}`,
    );
  }

  return { id: data.id, url: data.url };
}
