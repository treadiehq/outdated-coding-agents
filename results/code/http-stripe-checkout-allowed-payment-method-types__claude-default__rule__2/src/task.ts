const STRIPE_CHECKOUT_SESSIONS_URL = "https://api.stripe.com/v1/checkout/sessions";

export interface CreateCheckoutSessionOptions {
  stripeSecretKey: string;
  successUrl: string;
  cancelUrl: string;
  /** Lets a retried request reuse the original session instead of creating a second one. */
  idempotencyKey?: string;
}

export interface CheckoutSession {
  id: string;
  /** Hosted Checkout page to redirect the customer to. */
  url: string;
}

interface StripeErrorResponse {
  error?: { message?: string };
}

/** Creates a hosted Checkout Session for a one-time $20 USD payment, payable by card only. */
export async function createCheckoutSession({
  stripeSecretKey,
  successUrl,
  cancelUrl,
  idempotencyKey,
}: CreateCheckoutSessionOptions): Promise<CheckoutSession> {
  const body = new URLSearchParams({
    mode: "payment",
    "allowed_payment_method_types[0]": "card",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "2000", // in cents
    "line_items[0][price_data][product_data][name]": "One-time payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  const response = await fetch(STRIPE_CHECKOUT_SESSIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as StripeErrorResponse | null;
    const message = payload?.error?.message ?? response.statusText;
    throw new Error(`Stripe Checkout Session creation failed (${response.status}): ${message}`);
  }

  const { id, url } = (await response.json()) as CheckoutSession;
  return { id, url };
}
