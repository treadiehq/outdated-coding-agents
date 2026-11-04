/** Run on the server; never expose the Stripe secret key to the browser. */
export async function createCheckoutSession(
  secretKey: string,
  successUrl: string,
  cancelUrl: string,
): Promise<{ id: string; url: string }> {
  // https://docs.stripe.com/api/checkout/sessions/create
  const body = new URLSearchParams({
    mode: "payment",
    ui_mode: "hosted_page",
    success_url: successUrl,
    cancel_url: cancelUrl,
    // Current API uses allowed_payment_method_types to restrict payment methods.
    "allowed_payment_method_types[0]": "card",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "2000",
    "line_items[0][price_data][product_data][name]": "One-time payment",
    "line_items[0][quantity]": "1",
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": "2026-10-28.endive",
    },
    body,
  });

  const session: {
    id?: string;
    url?: string | null;
    error?: { message?: string };
  } = await response.json();

  if (!response.ok) {
    throw new Error(
      `Stripe Checkout request failed (${response.status}): ${
        session.error?.message ?? response.statusText
      }`,
    );
  }
  if (typeof session.id !== "string" || typeof session.url !== "string") {
    throw new Error("Stripe returned a Checkout Session without an ID or hosted URL.");
  }

  return { id: session.id, url: session.url };
}
