/**
 * Run on the server only; never expose the Stripe secret key to a browser.
 * Redirect the customer to the returned URL.
 * API reference: https://docs.stripe.com/api/checkout/sessions/create
 * Cards must be enabled in your Stripe payment method settings.
 */
export async function createCheckoutSession(options: {
  secretKey: string;
  successUrl: string;
  cancelUrl: string;
  /** Reuse the same key when retrying creation for the same purchase. */
  idempotencyKey: string;
}): Promise<{ id: string; url: string }> {
  const body = new URLSearchParams({
    mode: "payment",
    ui_mode: "hosted_page",
    // Current API uses this filter instead of payment_method_types.
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

  const result: {
    id?: string;
    url?: string | null;
    error?: { message?: string };
  } = await response.json();

  if (!response.ok) {
    throw new Error(
      `Stripe Checkout creation failed (${response.status}): ${
        result.error?.message ?? response.statusText
      }`,
    );
  }
  if (typeof result.id !== "string" || typeof result.url !== "string") {
    throw new Error("Stripe did not return a hosted Checkout Session URL.");
  }

  return { id: result.id, url: result.url };
}
