interface CheckoutSession {
  id: string;
  url: string;
}

export async function createCheckoutSession(
  secretKey: string,
  successUrl: string,
  cancelUrl: string,
): Promise<CheckoutSession> {
  const body = new URLSearchParams({
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    "allowed_payment_method_types[0]": "card",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "2000", // $20.00 in cents
    "line_items[0][price_data][product_data][name]": "One-time payment",
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `Stripe error ${response.status}: ${data?.error?.message ?? "unknown error"}`,
    );
  }

  return { id: data.id, url: data.url };
}
