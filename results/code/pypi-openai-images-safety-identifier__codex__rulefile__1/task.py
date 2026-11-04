"""Generate images with attribution to an authenticated customer.

API reference: https://developers.openai.com/api/reference/resources/images/methods/generate
Requires the official openai Python SDK and OPENAI_API_KEY in the environment.
"""

import base64

from openai import OpenAI


def generate_image(prompt: str, customer_id: str) -> bytes:
    """Return a generated PNG as bytes.

    The server must obtain customer_id from the authenticated session, rather
    than trusting a caller-supplied ID in the request body. Use a stable opaque
    internal customer ID, without personal information, for abuse attribution.
    """
    if not prompt.strip():
        raise ValueError("prompt must not be empty")
    if not customer_id.strip() or len(customer_id) > 128:
        raise ValueError("customer_id must contain 1–128 characters")

    with OpenAI() as client:
        response = client.images.generate(
            model="gpt-image-2.5-sunburst",
            prompt=prompt,
            safety_identifier=customer_id,
            n=1,
            output_format="png",
        )

    if not response.data or not response.data[0].b64_json:
        raise RuntimeError("Image generation returned no image data")
    return base64.b64decode(response.data[0].b64_json, validate=True)
