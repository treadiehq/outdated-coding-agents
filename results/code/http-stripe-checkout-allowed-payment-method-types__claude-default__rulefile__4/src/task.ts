const STRIPE_API_VERSION = "2026-10-28.endive";

export interface CreateCheckoutSessionOptions {
  secretKey: string;
  successUrl: string;
  cancelUrl?: string;
  productName?: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
}

/**
 * Creates a Stripe-hosted Checkout Session for a one-time $20 USD card payment.
 * Redirect the customer to the returned `url`. Call this server-side only, since
 * it uses your secret key.
 */
export async function createCheckoutSession({
  secretKey,
  successUrl,
  cancelUrl,
  productName = "One-time payment",
}: CreateCheckoutSessionOptions): Promise<CheckoutSession> {
  const body = new URLSearchParams({
    mode: "payment",
    ui_mode: "hosted_page",
    success_url: successUrl,
    "allowed_payment_method_types[0]": "card",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "2000",
    "line_items[0][price_data][product_data][name]": productName,
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
    const text = await response.text();
    throw new Error(`Stripe API error (${response.status}): ${text}`);
  }

  const session = (await response.json()) as { id: string; url: string | null };
  if (!session.url) {
    throw new Error(`Stripe returned Checkout Session ${session.id} without a url`);
  }
  return { id: session.id, url: session.url };
}
