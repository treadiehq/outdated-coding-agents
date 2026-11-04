export interface CreateCheckoutSessionOptions {
  secretKey: string;
  successUrl: string;
  cancelUrl: string;
  /** Prevents duplicate sessions when a request is retried. */
  idempotencyKey?: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
}

/** Creates a hosted Checkout Session for a one-time $20 USD payment, card only. */
export async function createCheckoutSession({
  secretKey,
  successUrl,
  cancelUrl,
  idempotencyKey,
}: CreateCheckoutSessionOptions): Promise<CheckoutSession> {
  const body = new URLSearchParams({
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    "allowed_payment_method_types[0]": "card",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "2000",
    "line_items[0][price_data][product_data][name]": "One-time payment",
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text;
    try {
      message = JSON.parse(text).error?.message ?? text;
    } catch {
      // Non-JSON error body: fall back to the raw text.
    }
    throw new Error(`Stripe API error (${response.status}): ${message}`);
  }

  const session = (await response.json()) as CheckoutSession;
  return { id: session.id, url: session.url };
}
