// Pinned because the parameters below depend on it: `hosted_page` needs
// 2026-03-25.dahlia or later, and `allowed_payment_method_types` replaces
// `payment_method_types`, which was removed for Checkout Sessions in 2026-09-30.endive.
const STRIPE_API_VERSION = "2026-10-28.endive";

export interface CreateCheckoutSessionOptions {
  /** Stripe secret key. Only call this function from server-side code. */
  secretKey: string;
  successUrl: string;
  cancelUrl: string;
  productName: string;
}

export interface CheckoutSession {
  id: string;
  /** Hosted page to redirect the customer to. */
  url: string;
}

export async function createCheckoutSession({
  secretKey,
  successUrl,
  cancelUrl,
  productName,
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
      success_url: successUrl,
      cancel_url: cancelUrl,
      "allowed_payment_method_types[0]": "card",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": "2000", // $20.00, in cents
      "line_items[0][price_data][product_data][name]": productName,
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
