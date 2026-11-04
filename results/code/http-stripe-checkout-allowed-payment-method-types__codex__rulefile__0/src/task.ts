/** Create a $20 USD Checkout Session server-side. Never expose the secret key. */
export async function createCheckoutSession(
  secretKey: string,
  successUrl: string,
  cancelUrl: string,
  idempotencyKey?: string,
): Promise<{ id: string; url: string }> {
  // https://docs.stripe.com/api/checkout/sessions/create
  // This API version uses allowed_payment_method_types and hosted_page.
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

  const headers: Record<string, string> = {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
    "Stripe-Version": "2026-10-28.endive",
  };
  // Reuse the same key when retrying the same logical purchase.
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers,
    body,
  });
  const session: {
    id?: string;
    url?: string | null;
    error?: { message?: string };
  } = await response.json();

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
