import base64
import hashlib

from openai import OpenAI

IMAGE_MODEL = "gpt-image-2"

client = OpenAI()


def safety_identifier_for(customer_id: str) -> str:
    """Return the stable, hashed identifier that OpenAI sees for a customer."""
    return hashlib.sha256(customer_id.encode("utf-8")).hexdigest()


def generate_image(prompt: str, customer_id: str) -> bytes:
    """Generate an image for a signed-in customer and return its PNG bytes."""
    # An empty identifier would be sent as unattributed, so reject it up front.
    if not customer_id:
        raise ValueError("customer_id must be a non-empty string")

    response = client.images.generate(
        model=IMAGE_MODEL,
        prompt=prompt,
        safety_identifier=safety_identifier_for(customer_id),
    )

    return base64.b64decode(response.data[0].b64_json)
