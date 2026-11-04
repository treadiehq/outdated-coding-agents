const STRIPE_API_BASE = "https://api.stripe.com";
// API version taken from the current Checkout Sessions reference.
const STRIPE_API_VERSION = "2026-10-28.endive";

export interface CreateCheckoutSessionOptions {
  /** Stripe secret key (sk_test_... / sk_live_...). */
  secretKey: string;
  /** Where Stripe sends the customer after a successful payment. */
  successUrl: string;
  /** Where Stripe sends the customer if they click the back button. */
  cancelUrl: string;
  /** Optional key to make retries safe. */
  idempotencyKey?: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
  status: string;
  payment_status: string;
  [key: string]: unknown;
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
    // Filters the dynamically eligible payment methods down to card only.
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

  const data = (await res.json()) as any;
  if (!res.ok) {
    const err = data?.error;
    throw new Error(
      `Stripe error (${res.status}): ${err?.message ?? res.statusText}`,
    );
  }
  return data as CheckoutSession;
}
