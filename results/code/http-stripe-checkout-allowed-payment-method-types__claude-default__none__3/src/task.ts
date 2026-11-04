const STRIPE_CHECKOUT_SESSIONS_URL = "https://api.stripe.com/v1/checkout/sessions";

export interface CreateCheckoutSessionOptions {
  /** Stripe secret key. Must only be used server-side. */
  secretKey: string;
  /** Where Stripe redirects the customer after a successful payment. */
  successUrl: string;
  /** Where Stripe redirects the customer if they abandon the payment. */
  cancelUrl: string;
  /** Reuse the same key when retrying so a retry can't create a duplicate session. */
  idempotencyKey?: string;
}

export interface CheckoutSession {
  id: string;
  /** Hosted Checkout page to redirect the customer to. */
  url: string;
}

/** Creates a hosted Stripe Checkout Session for a one-time $20 USD card payment. */
export async function createCheckoutSession({
  secretKey,
  successUrl,
  cancelUrl,
  idempotencyKey,
}: CreateCheckoutSessionOptions): Promise<CheckoutSession> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  const response = await fetch(STRIPE_CHECKOUT_SESSIONS_URL, {
    method: "POST",
    headers,
    body: new URLSearchParams({
      mode: "payment",
      "payment_method_types[0]": "card",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": "2000", // In cents.
      "line_items[0][price_data][product_data][name]": "Payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(
      `Stripe request failed (${response.status}): ${body.error?.message ?? "unknown error"}`,
    );
  }

  return { id: body.id, url: body.url };
}
