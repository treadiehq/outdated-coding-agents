"""Generate images with customer attribution using the official OpenAI SDK."""

import base64
import hashlib

from openai import OpenAI


def generate_image(prompt: str, customer_id: str) -> bytes:
    """Return PNG bytes for a prompt from a signed-in customer.

    Obtain customer_id from your trusted, authenticated server-side session,
    rather than a customer-supplied request field. OPENAI_API_KEY must be set.
    The stable hash attributes requests without sending the raw customer ID.

    See https://developers.openai.com/api/docs/guides/image-generation#safety-identifiers
    """
    if not isinstance(prompt, str) or not prompt.strip():
        raise ValueError("prompt must be a nonempty string")
    if not isinstance(customer_id, str) or not customer_id.strip():
        raise ValueError("customer_id must be a nonempty authenticated customer ID")

    safety_identifier = hashlib.sha256(customer_id.encode("utf-8")).hexdigest()
    with OpenAI() as client:
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
