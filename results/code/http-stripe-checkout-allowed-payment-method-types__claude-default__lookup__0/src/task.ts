const STRIPE_API_VERSION = "2026-10-28.endive";

export interface CreateCheckoutSessionOptions {
  secretKey: string;
  productName: string;
  successUrl: string;
  cancelUrl?: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
}

/** Creates a Stripe-hosted Checkout Session for a one-time, card-only $20 USD payment. */
export async function createCheckoutSession({
  secretKey,
  productName,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionOptions): Promise<CheckoutSession> {
  const body = new URLSearchParams({
    mode: "payment",
    ui_mode: "hosted_page",
    // `payment_method_types` returns a 400 on this API version.
    "allowed_payment_method_types[0]": "card",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "2000",
    "line_items[0][price_data][product_data][name]": productName,
    success_url: successUrl,
  });
  if (cancelUrl !== undefined) {
    body.set("cancel_url", cancelUrl);
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": STRIPE_API_VERSION,
    },
    body,
  });

  if (!response.ok) {
    const details = await response.json().catch(() => null);
    const message = details?.error?.message ?? response.statusText;
    throw new Error(`Stripe API error (${response.status}): ${message}`);
  }

  const session = await response.json();
  return { id: session.id, url: session.url };
}
