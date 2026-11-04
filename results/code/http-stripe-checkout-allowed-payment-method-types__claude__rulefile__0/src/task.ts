export interface CheckoutSession {
  id: string;
  url: string;
}

export interface CreateCheckoutSessionOptions {
  /** Stripe secret key (sk_...). */
  secretKey: string;
  /** Where Stripe redirects after successful payment. */
  successUrl: string;
  /** Where Stripe redirects if the customer cancels. */
  cancelUrl: string;
  /** Optional idempotency key to make retries safe. */
  idempotencyKey?: string;
}

/**
 * Creates a hosted Stripe Checkout Session for a one-time $20 payment,
 * restricted to card payments. Returns the session id and hosted page URL.
 */
export async function createCheckoutSession(
  opts: CreateCheckoutSessionOptions,
): Promise<CheckoutSession> {
  const body = new URLSearchParams({
    mode: "payment",
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    "payment_method_types[0]": "card",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "2000", // $20.00 in cents
    "line_items[0][price_data][product_data][name]": "One-time payment",
  });

  const headers: Record<string, string> = {
    Authorization: `Bearer ${opts.secretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers,
    body,
  });

  const data = (await res.json()) as {
    id?: string;
    url?: string | null;
    error?: { message?: string; type?: string; code?: string };
  };

  if (!res.ok) {
    throw new Error(
      `Stripe error (${res.status}): ${data.error?.message ?? res.statusText}`,
    );
  }
  if (!data.id || !data.url) {
    throw new Error("Stripe response missing session id or url");
  }

  return { id: data.id, url: data.url };
}
