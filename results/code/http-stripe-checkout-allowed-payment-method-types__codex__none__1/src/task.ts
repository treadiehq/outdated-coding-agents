/** Call on the server only; never expose your Stripe secret key to a browser. */
export async function createCheckoutSession(options: {
  secretKey: string;
  successUrl: string;
  cancelUrl: string;
  /** Reuse this key when retrying the same purchase. */
  idempotencyKey: string;
}): Promise<{ id: string; url: string }> {
  const body = new URLSearchParams({
    mode: "payment",
    ui_mode: "hosted_page",
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    // API reference: https://docs.stripe.com/api/checkout/sessions/create
    "allowed_payment_method_types[0]": "card",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "2000",
    "line_items[0][price_data][product_data][name]": "One-time payment",
    "line_items[0][quantity]": "1",
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
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
  if (typeof session.id !== "string" || typeof session.url !== "string") {
    throw new Error("Stripe returned a Checkout Session without an ID or hosted URL.");
  }

  return { id: session.id, url: session.url };
}
