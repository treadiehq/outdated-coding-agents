// Pinned because the account's default API version may predate
// `allowed_payment_method_types` on Checkout Sessions (added in 2026-09-30.endive,
// which also removed the `payment_method_types` request parameter).
const STRIPE_VERSION = "2026-10-28.endive";

export interface CreateCheckoutSessionOptions {
  apiKey: string;
  successUrl: string;
  cancelUrl?: string;
  productName: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
}

export async function createCheckoutSession({
  apiKey,
  successUrl,
  cancelUrl,
  productName,
}: CreateCheckoutSessionOptions): Promise<CheckoutSession> {
  const body = new URLSearchParams({
    mode: "payment",
    ui_mode: "hosted_page",
    success_url: successUrl,
    "allowed_payment_method_types[0]": "card",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "2000",
    "line_items[0][price_data][product_data][name]": productName,
  });
  if (cancelUrl !== undefined) {
    body.set("cancel_url", cancelUrl);
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": STRIPE_VERSION,
    },
    body,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `Stripe request failed (${response.status}): ${data.error?.message ?? "unknown error"}`,
    );
  }

  return { id: data.id, url: data.url };
}
