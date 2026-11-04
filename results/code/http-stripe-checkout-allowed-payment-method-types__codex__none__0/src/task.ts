/** Call on the server only; never expose the Stripe secret key to a browser. */
export async function createCheckoutSession(options: {
  secretKey: string;
  successUrl: string;
  cancelUrl: string;
  /** Reuse this key when retrying the same purchase. */
  idempotencyKey: string;
}): Promise<{ id: string; url: string }> {
  const body = new URLSearchParams({
    mode: "payment",
    // Checkout defaults to Stripe-hosted UI.
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    // Endive uses this allowlist to restrict eligible methods to cards.
    "allowed_payment_method_types[0]": "card",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "2000",
    "line_items[0][price_data][product_data][name]": "One-time payment",
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": "2026-09-30.endive",
      "Idempotency-Key": options.idempotencyKey,
    },
    body,
  });

  const result: {
    id?: string;
    url?: string | null;
    error?: { message?: string };
  } = await response.json();

  if (!response.ok) {
    throw new Error(
      `Stripe Checkout creation failed (${response.status}): ${result.error?.message ?? response.statusText}`,
    );
  }
  if (typeof result.id !== "string" || typeof result.url !== "string") {
    throw new Error("Stripe did not return a hosted Checkout Session URL.");
  }

  return { id: result.id, url: result.url };
}
