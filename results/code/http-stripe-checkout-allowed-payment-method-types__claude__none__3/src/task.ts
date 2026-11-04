export interface CheckoutSession {
  id: string;
  url: string;
}

export async function createCheckoutSession(
  secretKey: string,
  successUrl: string,
  cancelUrl: string,
  idempotencyKey?: string,
): Promise<CheckoutSession> {
  const body = new URLSearchParams({
    mode: "payment",
    "payment_method_types[0]": "card",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "2000", // $20.00 in cents
    "line_items[0][price_data][product_data][name]": "One-time payment",
    "line_items[0][quantity]": "1",
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  const headers: Record<string, string> = {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers,
    body,
  });

  const data = (await res.json()) as {
    id?: string;
    url?: string;
    error?: { message?: string };
  };

  if (!res.ok || !data.id || !data.url) {
    throw new Error(
      `Stripe error (${res.status}): ${data.error?.message ?? "unexpected response"}`,
    );
  }

  return { id: data.id, url: data.url };
}
