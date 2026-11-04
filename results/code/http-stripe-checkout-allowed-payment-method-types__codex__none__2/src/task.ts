/** Run on your server only; never expose the Stripe secret key to a browser. */
export async function createCheckoutSession(options: {
  secretKey: string;
  successUrl: string;
  cancelUrl: string;
  /** Reuse the same key when retrying the same logical purchase. */
  idempotencyKey: string;
}): Promise<{ id: string; url: string }> {
  const body = new URLSearchParams({
    mode: "payment",
    // Omitting ui_mode uses Stripe's hosted Checkout page.
    "allowed_payment_method_types[0]": "card",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "2000",
    "line_items[0][price_data][product_data][name]": "One-time payment",
    "line_items[0][quantity]": "1",
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      // Pin the version that supports allowed_payment_method_types.
      "Stripe-Version": "2026-10-28.endive",
      "Idempotency-Key": options.idempotencyKey,
    },
    body,
  });

  const session = (await response.json()) as {
    id?: string;
    url?: string | null;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(
      `Stripe Checkout creation failed (${response.status}): ${session.error?.message ?? response.statusText}`,
    );
  }
  if (!session.id || !session.url) {
    throw new Error("Stripe returned a Checkout Session without an ID or hosted URL.");
  }

  return { id: session.id, url: session.url };
}
