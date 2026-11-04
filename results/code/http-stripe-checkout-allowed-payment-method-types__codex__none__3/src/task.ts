/** Call on the server only; never expose the Stripe secret key to a browser. */
export async function createCheckoutSession(options: {
  secretKey: string;
  successUrl: string;
  cancelUrl: string;
  /** Reuse this key when retrying the same logical purchase. */
  idempotencyKey: string;
}): Promise<{ id: string; url: string }> {
  const { secretKey, successUrl, cancelUrl, idempotencyKey } = options;
  if (!secretKey || !idempotencyKey) {
    throw new Error("Stripe secret key and idempotency key are required.");
  }

  // https://docs.stripe.com/api/checkout/sessions/create
  // This API version uses allowed_payment_method_types as a strict filter.
  // Enable cards in your Stripe Dashboard's payment method settings.
  const body = new URLSearchParams({
    mode: "payment",
    ui_mode: "hosted_page",
    "allowed_payment_method_types[0]": "card",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "2000",
    "line_items[0][price_data][product_data][name]": "One-time payment",
    "line_items[0][quantity]": "1",
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": "2026-10-28.endive",
      "Idempotency-Key": idempotencyKey,
    },
    body,
  });

  const data = (await response.json()) as {
    id?: unknown;
    url?: unknown;
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(
      `Stripe Checkout creation failed (${response.status}): ${data.error?.message ?? response.statusText}`,
    );
  }
  if (typeof data.id !== "string" || typeof data.url !== "string") {
    throw new Error("Stripe returned a Checkout Session without an ID or hosted URL.");
  }

  return { id: data.id, url: data.url };
}
