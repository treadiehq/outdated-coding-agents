const STRIPE_API_VERSION = "2026-10-28.endive";

export interface CreateCheckoutSessionOptions {
  /** Stripe secret key. Only call this function from server-side code. */
  apiKey: string;
  /** Where Stripe sends the customer after a successful payment. */
  successUrl: string;
  /** Where Stripe sends the customer if they click back on the Checkout page. */
  cancelUrl?: string;
  /** Name shown to the customer on the Checkout page. */
  productName?: string;
}

export interface CheckoutSession {
  id: string;
  /** Hosted Checkout page to redirect the customer to. */
  url: string;
}

/** Creates a hosted Checkout Session for a one-time $20 USD card payment. */
export async function createCheckoutSession({
  apiKey,
  successUrl,
  cancelUrl,
  productName = "One-time payment",
}: CreateCheckoutSessionOptions): Promise<CheckoutSession> {
  const params = new URLSearchParams({
    mode: "payment",
    ui_mode: "hosted_page",
    success_url: successUrl,
    // payment_method_types was removed from this endpoint in 2026-09-30.endive.
    "allowed_payment_method_types[0]": "card",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "2000", // in cents
    "line_items[0][price_data][product_data][name]": productName,
  });
  if (cancelUrl) params.set("cancel_url", cancelUrl);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      // Pinned so the request doesn't depend on the account's default API version.
      "Stripe-Version": STRIPE_API_VERSION,
    },
    body: params,
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(
      `Stripe request failed (${response.status}): ${body.error?.message ?? "unknown error"}`,
    );
  }

  return { id: body.id, url: body.url };
}
