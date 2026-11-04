/**
 * Call on the server only; never expose the Stripe secret key to the browser.
 * Requires a runtime with native fetch and URLSearchParams.
 * Reference: https://docs.stripe.com/api/checkout/sessions/create
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
    ui_mode: "hosted_page",
    // Current API: filter eligible methods to cards (enable cards in Dashboard).
    "allowed_payment_method_types[0]": "card",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "2000",
    "line_items[0][price_data][product_data][name]": "One-time payment",
    "line_items[0][quantity]": "1",
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
  });

  const headers: Record<string, string> = {
    Authorization: `Bearer ${options.secretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
    "Stripe-Version": "2026-10-28.endive",
  };
  if (options.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers,
    body,
  });
  const session: {
    id?: unknown;
    url?: unknown;
    error?: { message?: string };
  } | null = await response.json();

  if (!response.ok) {
    throw new Error(
      `Stripe Checkout creation failed (${response.status}): ${
        session?.error?.message ?? response.statusText
      }`,
    );
  }
  if (typeof session?.id !== "string" || typeof session.url !== "string") {
    throw new Error("Stripe returned a Checkout Session without an ID or hosted URL.");
  }

  return { id: session.id, url: session.url };
}
