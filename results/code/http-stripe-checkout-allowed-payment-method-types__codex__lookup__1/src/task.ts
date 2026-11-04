export interface CheckoutSessionOptions {
  secretKey: string;
  successUrl: string;
  cancelUrl: string;
  /** Reuse for retries of the same purchase; use a new key for each purchase. */
  idempotencyKey?: string;
}

/** Create a one-time USD $20 Checkout Session. Call only on the server. */
export async function createCheckoutSession({
  secretKey,
  successUrl,
  cancelUrl,
  idempotencyKey,
}: CheckoutSessionOptions): Promise<{ id: string; url: string }> {
  if (!secretKey.trim()) throw new Error("A Stripe secret key is required.");

  // Verified against https://docs.stripe.com/api/checkout/sessions/create
  // for API version 2026-10-28.endive.
  const body = new URLSearchParams({
    mode: "payment",
    ui_mode: "hosted_page",
    success_url: successUrl,
    cancel_url: cancelUrl,
    "allowed_payment_method_types[0]": "card",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "2000",
    "line_items[0][price_data][product_data][name]": "One-time payment",
    "line_items[0][quantity]": "1",
  });

  const headers: Record<string, string> = {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
    "Stripe-Version": "2026-10-28.endive",
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers,
    body,
  });
  const result: unknown = await response.json();

  if (!response.ok) {
    let message = response.statusText;
    if (typeof result === "object" && result !== null && "error" in result) {
      const error = result.error;
      if (
        typeof error === "object" && error !== null &&
        "message" in error && typeof error.message === "string"
      ) {
        message = error.message;
      }
    }
    throw new Error(`Stripe Checkout Session creation failed (${response.status}): ${message}`);
  }

  if (
    typeof result !== "object" || result === null ||
    !("id" in result) || typeof result.id !== "string" ||
    !("url" in result) || typeof result.url !== "string"
  ) {
    throw new Error("Stripe returned a Checkout Session without an ID or hosted URL.");
  }

  return { id: result.id, url: result.url };
}
