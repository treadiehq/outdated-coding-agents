"""Generate customer images using the official OpenAI Python SDK.

API reference:
https://developers.openai.com/api/reference/python/resources/images/methods/generate
"""

import base64
import hashlib

from openai import OpenAI


def generate_image(prompt: str, customer_id: str) -> bytes:
    """Return PNG bytes for a prompt from an authenticated customer.

    Pass customer_id from the trusted server-side sign-in session, rather than
    from user-submitted input. It must be a stable, unique customer identifier.
    Its SHA-256 digest provides consistent abuse attribution without sending
    the raw identifier. The SDK reads credentials from OPENAI_API_KEY.
    """
    if not isinstance(prompt, str) or not prompt.strip():
        raise ValueError("prompt must be a non-empty string")
    if not isinstance(customer_id, str) or not customer_id.strip():
        raise ValueError("customer_id must identify the signed-in customer")

    safety_identifier = hashlib.sha256(customer_id.encode("utf-8")).hexdigest()
    with OpenAI() as client:
        result = client.images.generate(
            model="gpt-image-2.5-flare",
            prompt=prompt,
            safety_identifier=safety_identifier,
            n=1,
            output_format="png",
        )

    if not result.data or not result.data[0].b64_json:
        raise RuntimeError("OpenAI returned no image data")
    return base64.b64decode(result.data[0].b64_json, validate=True)
