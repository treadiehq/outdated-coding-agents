import base64
import hashlib

from openai import OpenAI

client = OpenAI()


def generate_image(prompt: str, customer_id: str, model: str = "gpt-image-2") -> bytes:
    """Generate an image for a signed-in customer and return its raw bytes."""
    if not customer_id:
        raise ValueError("customer_id is required")

    # Hashed so the ID stays stable for abuse attribution without sending identifying data.
    safety_identifier = hashlib.sha256(customer_id.encode()).hexdigest()

    response = client.images.generate(
        model=model,
        prompt=prompt,
        safety_identifier=safety_identifier,
    )

    if not response.data or not response.data[0].b64_json:
        raise RuntimeError("Image generation returned no image data")

    # GPT image models always return base64-encoded images.
    return base64.b64decode(response.data[0].b64_json)
