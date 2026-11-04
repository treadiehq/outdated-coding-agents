"""Generate customer images with the official OpenAI Python SDK.

Checked against openai 3.35.1 and the Images API reference:
https://developers.openai.com/api/reference/resources/images/methods/generate
"""

import base64
import hashlib

from openai import OpenAI


def generate_image(prompt: str, customer_id: str, *, client: OpenAI) -> bytes:
    """Return PNG bytes for a prompt on behalf of an authenticated customer.

    Supply customer_id from the trusted server-side sign-in session, rather
    than a request field controlled by the customer. Its stable SHA-256 hash
    provides abuse attribution without sending the raw customer ID.
    Pass a configured OpenAI client (for example, OpenAI(), which reads
    OPENAI_API_KEY). SDK/API errors propagate to the caller.
    """
    if not isinstance(prompt, str) or not prompt.strip():
        raise ValueError("prompt must be a nonempty string")
    if not isinstance(customer_id, str) or not customer_id.strip():
        raise ValueError("customer_id must be a nonempty authenticated customer ID")

    # The legacy `user` parameter is deprecated; use safety_identifier.
    safety_identifier = hashlib.sha256(customer_id.encode("utf-8")).hexdigest()
    response = client.images.generate(
        model="gpt-image-2.5-flare",
        prompt=prompt,
        safety_identifier=safety_identifier,
        n=1,
        output_format="png",
    )
    if not response.data or not response.data[0].b64_json:
        raise RuntimeError("OpenAI returned no image data")
    return base64.b64decode(response.data[0].b64_json, validate=True)
