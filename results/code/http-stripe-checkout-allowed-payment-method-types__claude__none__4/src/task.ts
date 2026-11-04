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
  params.set("mode", "payment");
  params.set("success_url", successUrl);
  params.set("cancel_url", cancelUrl);
  params.set("payment_method_types[0]", "card");
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", "2000"); // $20.00 in cents
  params.set("line_items[0][price_data][product_data][name]", "One-time payment");

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = (await res.json()) as {
    id?: string;
    url?: string;
    error?: { message?: string };
  };

  if (!res.ok || !data.id || !data.url) {
    throw new Error(
      `Stripe error (${res.status}): ${data.error?.message ?? "unknown error"}`,
    );
  }

  return { id: data.id, url: data.url };
}
