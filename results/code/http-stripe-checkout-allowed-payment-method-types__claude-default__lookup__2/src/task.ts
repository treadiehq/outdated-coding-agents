const STRIPE_CHECKOUT_SESSIONS_URL = "https://api.stripe.com/v1/checkout/sessions";

// Pinned so requests don't depend on the account's default API version.
// `allowed_payment_method_types` replaces `payment_method_types`, which this
// version rejects on Checkout Session creation.
const STRIPE_API_VERSION = "2026-10-28.endive";

export interface CreateCheckoutSessionOptions {
  apiKey: string;
  productName: string;
  successUrl: string;
  cancelUrl?: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
}

/** Creates a Stripe-hosted Checkout Session for a one-time, card-only $20 payment. */
export async function createCheckoutSession({
  apiKey,
  productName,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionOptions): Promise<CheckoutSession> {
  const body = new URLSearchParams({
    mode: "payment",
    ui_mode: "hosted_page",
    "allowed_payment_method_types[0]": "card",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "2000",
    "line_items[0][price_data][product_data][name]": productName,
    success_url: successUrl,
  });
  if (cancelUrl) {
    body.set("cancel_url", cancelUrl);
  }

  const response = await fetch(STRIPE_CHECKOUT_SESSIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": STRIPE_API_VERSION,
    },
    body,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `Stripe error (${response.status}): ${data?.error?.message ?? "Unknown error"}`,
    );
  }

  return { id: data.id, url: data.url };
}
