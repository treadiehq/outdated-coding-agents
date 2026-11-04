const STRIPE_CHECKOUT_SESSIONS_URL = "https://api.stripe.com/v1/checkout/sessions";

// Stripe amounts are in the currency's smallest unit, so 2000 is $20.00.
const AMOUNT_IN_CENTS = 2000;

export interface CreateCheckoutSessionParams {
  /** Stripe secret key. Keep this server-side. */
  secretKey: string;
  /** Shown to the customer on the Checkout page. */
  productName: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSession {
  id: string;
  /** Hosted Checkout page to redirect the customer to. */
  url: string;
}

/** Creates a hosted Checkout Session for a one-time $20 card payment. */
export async function createCheckoutSession({
  secretKey,
  productName,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionParams): Promise<CheckoutSession> {
  const response = await fetch(STRIPE_CHECKOUT_SESSIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      mode: "payment",
      "payment_method_types[0]": "card",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(AMOUNT_IN_CENTS),
      "line_items[0][price_data][product_data][name]": productName,
      success_url: successUrl,
      cancel_url: cancelUrl,
    }),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message = body?.error?.message ?? "Unknown error";
    throw new Error(`Stripe API error (${response.status}): ${message}`);
  }

  return { id: body.id, url: body.url };
}
