const STRIPE_CHECKOUT_SESSIONS_URL = "https://api.stripe.com/v1/checkout/sessions";

// Pinned so the request doesn't depend on the account's default API version.
// `hosted_page` needs 2026-03-25 or later; `allowed_payment_method_types` needs 2026-09-30 or later.
const STRIPE_API_VERSION = "2026-10-28.endive";

const AMOUNT_IN_CENTS = 2000;

export interface CreateCheckoutSessionOptions {
  secretKey: string;
  successUrl: string;
  cancelUrl: string;
  productName: string;
}

export interface CheckoutSession {
  id: string;
  /** The Stripe-hosted page to redirect the customer to. */
  url: string;
}

/** Creates a hosted Checkout Session for a one-time $20 USD payment, payable by card only. */
export async function createCheckoutSession({
  secretKey,
  successUrl,
  cancelUrl,
  productName,
}: CreateCheckoutSessionOptions): Promise<CheckoutSession> {
  const response = await fetch(STRIPE_CHECKOUT_SESSIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": STRIPE_API_VERSION,
    },
    body: new URLSearchParams({
      mode: "payment",
      ui_mode: "hosted_page",
      success_url: successUrl,
      cancel_url: cancelUrl,
      "allowed_payment_method_types[0]": "card",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(AMOUNT_IN_CENTS),
      "line_items[0][price_data][product_data][name]": productName,
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(
      `Stripe Checkout Session creation failed (${response.status}): ${body?.error?.message ?? response.statusText}`,
    );
  }

  const { id, url } = (await response.json()) as CheckoutSession;
  return { id, url };
}
