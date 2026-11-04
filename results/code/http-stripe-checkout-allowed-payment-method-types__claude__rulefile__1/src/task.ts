const STRIPE_API_BASE = "https://api.stripe.com";
// API version taken from the current Create Checkout Session reference.
const STRIPE_API_VERSION = "2026-10-28.endive";

export interface CheckoutSessionOptions {
  secretKey: string;
  successUrl: string;
  cancelUrl: string;
  /** Optional; makes retries safe (Stripe returns the original result). */
  idempotencyKey?: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
  status: string;
  payment_status: string;
  amount_total: number;
  currency: string;
}

/**
 * Creates a hosted Checkout Session for a one-time $20.00 USD payment,
 * restricted to card payments. Redirect the customer to the returned `url`.
 */
export async function createCheckoutSession(
  opts: CheckoutSessionOptions,
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

  const data: any = await res.json();
  if (!res.ok) {
    const err = data?.error;
    throw new Error(
      `Stripe error ${res.status}${err?.code ? ` (${err.code})` : ""}: ${err?.message ?? "unknown error"}`,
    );
  }
  return data as CheckoutSession;
}
