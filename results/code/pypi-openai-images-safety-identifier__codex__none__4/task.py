"""Generate customer images with attribution for abuse monitoring."""

import base64
import hashlib

from openai import OpenAI


def generate_image(prompt: str, customer_id: str) -> bytes:
    """Return PNG bytes for a prompt from an authenticated customer.

    Obtain customer_id from the verified server-side sign-in session, never
    from an untrusted request field. Use a stable customer ID so requests can
    be attributed consistently. OPENAI_API_KEY must be set in the environment.

    The customer ID is hashed to avoid sending identifying information.
    API errors propagate to the caller.

    Official reference:
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
            n=1,
            output_format="png",
            safety_identifier=safety_identifier,
        )

    if not result.data or not result.data[0].b64_json:
        raise RuntimeError("Image generation returned no image data")
    return base64.b64decode(result.data[0].b64_json, validate=True)
