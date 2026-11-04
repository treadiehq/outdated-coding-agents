export interface CheckoutSession {
  id: string;
  url: string;
}

export async function createCheckoutSession(
  secretKey: string,
  successUrl: string,
  cancelUrl: string,
): Promise<CheckoutSession> {
  const params = new URLSearchParams();
  params.append("mode", "payment");
  params.append("success_url", successUrl);
  params.append("cancel_url", cancelUrl);
  params.append("payment_method_types[0]", "card");
  params.append("line_items[0][quantity]", "1");
  params.append("line_items[0][price_data][currency]", "usd");
  params.append("line_items[0][price_data][unit_amount]", "2000"); // $20.00 in cents
  params.append("line_items[0][price_data][product_data][name]", "One-time payment");

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const data = (await res.json()) as any;
  if (!res.ok) {
    throw new Error(`Stripe error (${res.status}): ${data?.error?.message ?? "unknown error"}`);
  }

  return { id: data.id, url: data.url };
}
