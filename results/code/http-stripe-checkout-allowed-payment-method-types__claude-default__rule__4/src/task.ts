const STRIPE_CHECKOUT_SESSIONS_URL = "https://api.stripe.com/v1/checkout/sessions";

export interface CreateCheckoutSessionOptions {
  /** Stripe secret key (sk_test_... or sk_live_...). */
  secretKey: string;
  /** Where Stripe redirects the customer after a successful payment. */
  successUrl: string;
  /** Where Stripe redirects the customer if they abandon checkout. */
  cancelUrl?: string;
  /** Name shown to the customer on the hosted checkout page. */
  productName?: string;
  /** Lets a retried request reuse the same session instead of creating another. */
  idempotencyKey?: string;
}

export interface CheckoutSession {
  id: string;
  /** Hosted checkout page to redirect the customer to. */
  url: string;
}

/** Creates a hosted Checkout Session for a one-time $20 USD payment, card only. */
export async function createCheckoutSession(
  options: CreateCheckoutSessionOptions,
): Promise<CheckoutSession> {
  const { secretKey, successUrl, cancelUrl, productName, idempotencyKey } = options;

  // Stripe's REST API takes form-encoded bodies, not JSON.
  const body = new URLSearchParams({
    mode: "payment",
    success_url: successUrl,
    "allowed_payment_method_types[0]": "card",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "2000", // Amount in cents.
    "line_items[0][price_data][product_data][name]": productName ?? "One-time payment",
  });
  if (cancelUrl) {
    body.set("cancel_url", cancelUrl);
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  const response = await fetch(STRIPE_CHECKOUT_SESSIONS_URL, {
    method: "POST",
    headers,
    body,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `Stripe error ${response.status}: ${data?.error?.message ?? "Unknown error"}`,
    );
  }

  return { id: data.id, url: data.url };
}
