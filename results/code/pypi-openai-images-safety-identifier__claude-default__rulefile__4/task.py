import base64
import hashlib

from openai import OpenAI

IMAGE_MODEL = "gpt-image-2"

client = OpenAI()


def generate_image(prompt: str, customer_id: str) -> bytes:
    """Generate an image for a signed-in customer and return its raw bytes (PNG by default)."""
    if not customer_id:
        raise ValueError("customer_id is required to attribute the request")

    # Hashed so the raw ID isn't sent to OpenAI; the same customer always maps to
    # the same value, so a flagged identifier can be traced back by hashing your IDs.
    safety_identifier = hashlib.sha256(customer_id.encode()).hexdigest()

    response = client.images.generate(
        model=IMAGE_MODEL,
        prompt=prompt,
        safety_identifier=safety_identifier,
    )

    if not response.data or not response.data[0].b64_json:
        raise RuntimeError("OpenAI returned no image data")
    return base64.b64decode(response.data[0].b64_json)
