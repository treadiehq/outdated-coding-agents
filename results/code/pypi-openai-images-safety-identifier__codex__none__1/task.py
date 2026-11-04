"""Generate customer-attributed images using the official OpenAI Python SDK."""

import base64
import hashlib

from openai import OpenAI


def generate_image(prompt: str, customer_id: str) -> bytes:
    """Return a generated PNG, attributing the request to a signed-in customer.

    Pass customer_id from your trusted, server-side authenticated session, rather
    than from request input. It must be a stable, unique customer ID. Its SHA-256
    digest is sent as the safety identifier so the raw ID stays private while
    repeated requests can be attributed to the same customer.

    Requires OPENAI_API_KEY in the environment. SDK/API errors propagate to the
    caller. This function does not save the image to disk.

    API reference:
    https://developers.openai.com/api/reference/python/resources/images/methods/generate
    """
    if not isinstance(prompt, str) or not prompt.strip():
        raise ValueError("prompt must be a non-empty string")
    if not isinstance(customer_id, str) or not customer_id.strip():
        raise ValueError("customer_id must be a non-empty authenticated customer ID")

    safety_identifier = hashlib.sha256(customer_id.encode("utf-8")).hexdigest()
    with OpenAI() as client:
        result = client.images.generate(
            model="gpt-image-2.5-flare",
            prompt=prompt,
            safety_identifier=safety_identifier,
            n=1,
            size="1024x1024",
            output_format="png",
        )

    if not result.data or not result.data[0].b64_json:
        raise RuntimeError("Image generation returned no image data")
    return base64.b64decode(result.data[0].b64_json, validate=True)
