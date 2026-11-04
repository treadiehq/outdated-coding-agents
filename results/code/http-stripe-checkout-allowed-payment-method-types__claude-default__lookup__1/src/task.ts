// Pinned because `allowed_payment_method_types` and `ui_mode=hosted_page` don't
// exist on older API versions, and an unpinned request uses the account's default.
const STRIPE_VERSION = "2026-10-28.endive";

export interface CreateCheckoutSessionOptions {
  secretKey: string;
  productName: string;
  successUrl: string;
  cancelUrl?: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
}

export async function createCheckoutSession({
  secretKey,
  productName,
  successUrl,
  cancelUrl,
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
  if (cancelUrl) body.set("cancel_url", cancelUrl);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": STRIPE_VERSION,
    },
    body,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `Stripe error (${response.status}): ${data.error?.message ?? "unknown error"}`,
    );
  }

  return { id: data.id, url: data.url };
}
