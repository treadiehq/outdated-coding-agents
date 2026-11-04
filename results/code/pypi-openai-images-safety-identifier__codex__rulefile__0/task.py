"""Generate customer-attributed images with the official OpenAI Python SDK."""

import base64
import hashlib

from openai import OpenAI


def generate_image(prompt: str, customer_id: str) -> bytes:
    """Return PNG bytes for a prompt submitted by a signed-in customer.

    Pass customer_id from the authenticated server-side session, rather than
    accepting an arbitrary ID from the request body. Use a stable, unique ID;
    its SHA-256 hash preserves attribution without sending the raw ID.
    The SDK reads the application's API key from OPENAI_API_KEY.

    API reference:
    https://developers.openai.com/api/reference/resources/images/methods/generate
    """
    if not isinstance(prompt, str) or not prompt.strip():
        raise ValueError("prompt must be a nonempty string")
    if not isinstance(customer_id, str) or not customer_id.strip():
        raise ValueError("customer_id must be a nonempty authenticated customer ID")

    safety_identifier = hashlib.sha256(customer_id.encode("utf-8")).hexdigest()
    with OpenAI() as client:
        response = client.images.generate(
            model="gpt-image-2.5-flare",
            prompt=prompt,
            safety_identifier=safety_identifier,
            n=1,
            output_format="png",
        )

    if not response.data or not response.data[0].b64_json:
        raise RuntimeError("The image generation response contained no image")
    return base64.b64decode(response.data[0].b64_json, validate=True)
