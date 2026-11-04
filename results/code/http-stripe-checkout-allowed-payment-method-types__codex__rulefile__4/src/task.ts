/**
 * Run on the server only; never expose the Stripe secret key to a browser.
 * Returns the hosted Checkout URL to redirect the customer to.
 * API reference: https://docs.stripe.com/api/checkout/sessions/create
 */
export async function createCheckoutSession(options: {
  secretKey: string;
  successUrl: string;
  cancelUrl: string;
  /** Reuse the same key when retrying the same purchase. */
  idempotencyKey?: string;
}): Promise<{ id: string; url: string }> {
  const body = new URLSearchParams({
    mode: "payment",
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    // Current API: filter eligible methods to cards only.
    "allowed_payment_method_types[0]": "card",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "2000",
    "line_items[0][price_data][product_data][name]": "One-time payment",
  });

  const headers: Record<string, string> = {
    Authorization: `Bearer ${options.secretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
    "Stripe-Version": "2026-10-28.endive",
  };
  if (options.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }

  // Hosted Checkout is the default UI when no ui_mode is supplied.
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers,
    body,
  });
  const data: unknown = await response.json();

  if (!response.ok) {
    let message = response.statusText;
    if (typeof data === "object" && data !== null && "error" in data) {
      const error = data.error;
      if (typeof error === "object" && error !== null &&
          "message" in error && typeof error.message === "string") {
        message = error.message;
      }
    }
    throw new Error(`Stripe Checkout failed (${response.status}): ${message}`);
  }

  if (typeof data !== "object" || data === null ||
      !("id" in data) || typeof data.id !== "string" ||
      !("url" in data) || typeof data.url !== "string") {
    throw new Error("Stripe returned a Checkout Session without an ID or hosted URL.");
  }

  return { id: data.id, url: data.url };
}
