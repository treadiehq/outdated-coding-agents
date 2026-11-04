"""Generate customer-attributed images with the official OpenAI Python SDK."""

import base64
import hashlib

from openai import OpenAI


def generate_image(prompt: str, customer_id: str, *, client: OpenAI) -> bytes:
    """Return a generated PNG, attributing the request to a signed-in customer.

    Supply customer_id from the trusted server-side authentication session,
    never from a caller-controlled request field. Use a stable, unique ID.
    Pass a reusable OpenAI client configured with your server's API key.

    API reference:
    https://developers.openai.com/api/reference/resources/images/methods/generate
    """
    if not prompt.strip():
        raise ValueError("prompt must not be empty")
    if not customer_id.strip():
        raise ValueError("customer_id must not be empty")

    # A stable hash preserves per-customer attribution without sending the raw ID.
    safety_identifier = hashlib.sha256(customer_id.encode("utf-8")).hexdigest()
    response = client.images.generate(
        model="gpt-image-2.5-sunburst",
        prompt=prompt,
        safety_identifier=safety_identifier,
        n=1,
        output_format="png",
    )
    if not response.data or not response.data[0].b64_json:
        raise RuntimeError("OpenAI returned no image data")
    return base64.b64decode(response.data[0].b64_json, validate=True)
