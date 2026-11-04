const STRIPE_API_VERSION = "2026-10-28.endive";

export interface CreateCheckoutSessionOptions {
  secretKey: string;
  productName: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
}

/**
 * Creates a Stripe-hosted Checkout Session for a one-time $20 card payment.
 * Redirect the customer to the returned `url`.
 */
export async function createCheckoutSession({
  secretKey,
  productName,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionOptions): Promise<CheckoutSession> {
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": STRIPE_API_VERSION,
    },
    body: new URLSearchParams({
      mode: "payment",
      ui_mode: "hosted_page",
      // payment_method_types was removed for Checkout Sessions in 2026-09-30.endive.
      "allowed_payment_method_types[0]": "card",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": "2000",
      "line_items[0][price_data][product_data][name]": productName,
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
