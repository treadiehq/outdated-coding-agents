"""Image generation using the official OpenAI Python SDK.

API reference:
https://developers.openai.com/api/reference/resources/images/methods/generate
Safety identifiers:
https://developers.openai.com/api/docs/guides/safety-best-practices#implement-safety-identifiers
"""

import base64
import hashlib

from openai import OpenAI


def generate_image(prompt: str, customer_id: str, *, client: OpenAI) -> bytes:
    """Return one generated image as PNG bytes.

    Supply customer_id from the server's authenticated customer session, never
    from an untrusted request field. Use a stable, unique customer ID so the
    hashed identifier remains attributable to that customer across requests.
    Pass an OpenAI client configured with the application's API credentials.
    SDK/API errors propagate to the caller.
    """
    if not isinstance(prompt, str) or not prompt.strip():
        raise ValueError("prompt must be a non-empty string")
    if not isinstance(customer_id, str) or not customer_id.strip():
        raise ValueError("customer_id must be a non-empty string")

    safety_identifier = hashlib.sha256(customer_id.encode("utf-8")).hexdigest()
    response = client.images.generate(
        model="gpt-image-1",
        prompt=prompt,
        n=1,
        output_format="png",
        safety_identifier=safety_identifier,
    )
    if not response.data or not response.data[0].b64_json:
        raise RuntimeError("OpenAI returned no image data")
    return base64.b64decode(response.data[0].b64_json, validate=True)
