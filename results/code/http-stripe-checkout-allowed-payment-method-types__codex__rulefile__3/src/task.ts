/** Creates a Stripe-hosted Checkout Session. Call only on your server. */
export async function createCheckoutSession(options: {
  secretKey: string;
  successUrl: string;
  cancelUrl: string;
  /** Reuse this key when retrying the same purchase. */
  idempotencyKey?: string;
}): Promise<{ id: string; url: string }> {
  // Current REST API reference: https://docs.stripe.com/api/checkout/sessions/create
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
  const session = (await response.json()) as {
    id?: string;
    url?: string | null;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(
      `Stripe Checkout failed (${response.status}): ${session.error?.message ?? response.statusText}`,
    );
  }
  if (typeof session.id !== "string" || typeof session.url !== "string") {
    throw new Error("Stripe did not return a hosted Checkout Session URL.");
  }

  return { id: session.id, url: session.url };
}
