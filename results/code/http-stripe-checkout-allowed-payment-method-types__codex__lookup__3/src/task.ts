/** Run on the server only; return the URL to redirect the customer to Checkout.
 * API reference: https://docs.stripe.com/api/checkout/sessions/create
 */
export async function createCheckoutSession(options: {
  secretKey: string;
  successUrl: string;
  cancelUrl: string;
  /** Reuse the same key when retrying the same purchase. */
  idempotencyKey: string;
}): Promise<{ id: string; url: string }> {
  const body = new URLSearchParams({
    mode: "payment",
    ui_mode: "hosted_page",
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
      "Stripe-Version": "2026-10-28.endive",
      "Idempotency-Key": options.idempotencyKey,
    },
    body,
  });

  const result: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof result === "object" && result !== null && "error" in result &&
      typeof result.error === "object" && result.error !== null &&
      "message" in result.error && typeof result.error.message === "string"
        ? result.error.message
        : "Checkout Session creation failed";
    throw new Error(`Stripe HTTP ${response.status}: ${message}`);
  }

  if (
    typeof result !== "object" || result === null ||
    !("id" in result) || typeof result.id !== "string" ||
    !("url" in result) || typeof result.url !== "string"
  ) {
    throw new Error("Stripe returned a Checkout Session without an ID or hosted URL");
  }

  return { id: result.id, url: result.url };
}
