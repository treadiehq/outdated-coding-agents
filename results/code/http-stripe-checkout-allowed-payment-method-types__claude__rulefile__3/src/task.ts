const STRIPE_API_BASE = "https://api.stripe.com";
// Pinned so request parameters behave as documented (allowed_payment_method_types).
const STRIPE_API_VERSION = "2026-10-28.endive";

export interface CheckoutSession {
  id: string;
  url: string;
  status: string;
  payment_status: string;
}

export interface CreateCheckoutSessionOptions {
  secretKey: string;
  successUrl: string;
  cancelUrl?: string;
  idempotencyKey?: string;
}

/**
 * Creates a Stripe-hosted Checkout Session for a one-time $20.00 payment,
 * restricted to card payments. Redirect the customer to the returned `url`.
 */
export async function createCheckoutSession(
  options: CreateCheckoutSessionOptions,
): Promise<CheckoutSession> {
  const { secretKey, successUrl, cancelUrl, idempotencyKey } = options;

  const body = new URLSearchParams({
    mode: "payment",
    success_url: successUrl,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "2000", // $20.00 in cents
    "line_items[0][price_data][product_data][name]": "One-time payment",
    "allowed_payment_method_types[0]": "card",
  });
  if (cancelUrl) body.set("cancel_url", cancelUrl);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
    "Stripe-Version": STRIPE_API_VERSION,
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const res = await fetch(`${STRIPE_API_BASE}/v1/checkout/sessions`, {
    method: "POST",
    headers,
    body,
  });

  const data = await res.json();
  if (!res.ok) {
    const message = data?.error?.message ?? res.statusText;
    throw new Error(`Stripe API error (${res.status}): ${message}`);
  }

  return data as CheckoutSession;
}
