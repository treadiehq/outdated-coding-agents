"""Generate customer-attributed images using the official OpenAI SDK."""

import base64

from openai import OpenAI


def generate_image(prompt: str, customer_id: str) -> bytes:
    """Return a generated PNG, attributing the request to a signed-in customer.

    Pass the stable, opaque customer ID from the server's authenticated session,
    rather than an ID supplied by the request body or an email address.
    Authentication is the caller's responsibility. Set OPENAI_API_KEY in the
    server environment. SDK errors propagate to the caller.

    API reference:
    https://developers.openai.com/api/reference/python/resources/images/methods/generate
    """
    if not isinstance(prompt, str) or not prompt.strip():
        raise ValueError("prompt must be a non-empty string")
    if (
        not isinstance(customer_id, str)
        or not customer_id.strip()
        or len(customer_id) > 128
    ):
        raise ValueError("customer_id must be a non-empty string of at most 128 characters")

    with OpenAI() as client:
        response = client.images.generate(
            model="gpt-image-2.5-flare",
            prompt=prompt,
            safety_identifier=customer_id,
            n=1,
            size="1024x1024",
            output_format="png",
        )

    if not response.data or not response.data[0].b64_json:
        raise RuntimeError("OpenAI returned no image data")
    return base64.b64decode(response.data[0].b64_json, validate=True)
