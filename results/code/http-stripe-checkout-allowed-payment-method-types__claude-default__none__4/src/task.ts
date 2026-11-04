const STRIPE_CHECKOUT_SESSIONS_URL = "https://api.stripe.com/v1/checkout/sessions";

export interface CreateCheckoutSessionOptions {
  /** Stripe secret key. Must only be used server-side. */
  secretKey: string;
  /** Where Stripe redirects the customer after a successful payment. */
  successUrl: string;
  /** Where Stripe redirects the customer if they abandon the payment. */
  cancelUrl: string;
  /** Name shown to the customer on the Checkout page. */
  productName?: string;
  /** Makes retries of the same logical request safe from creating duplicates. */
  idempotencyKey?: string;
}

export interface CheckoutSession {
  id: string;
  /** Hosted Checkout page to redirect the customer to. */
  url: string;
}

/** Creates a hosted Stripe Checkout Session for a one-time, card-only $20 payment. */
export async function createCheckoutSession({
  secretKey,
  successUrl,
  cancelUrl,
  productName = "One-time payment",
  idempotencyKey,
}: CreateCheckoutSessionOptions): Promise<CheckoutSession> {
  const body = new URLSearchParams({
    mode: "payment",
    "payment_method_types[0]": "card",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    // Stripe amounts are in the currency's smallest unit: 2000 cents = $20.00.
    "line_items[0][price_data][unit_amount]": "2000",
    "line_items[0][price_data][product_data][name]": productName,
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  const response = await fetch(STRIPE_CHECKOUT_SESSIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body,
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Stripe request failed (${response.status}): ${stripeErrorMessage(text)}`);
  }

  const session = JSON.parse(text) as { id: string; url: string | null };
  if (!session.url) {
    throw new Error(`Stripe Checkout Session ${session.id} has no redirect URL`);
  }

  return { id: session.id, url: session.url };
}

function stripeErrorMessage(responseText: string): string {
  try {
    const parsed = JSON.parse(responseText) as { error?: { message?: string } };
    return parsed.error?.message ?? responseText;
  } catch {
    return responseText;
  }
}
