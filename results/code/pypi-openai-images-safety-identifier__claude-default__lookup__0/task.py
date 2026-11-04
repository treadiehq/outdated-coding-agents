import base64
import hashlib

from openai import OpenAI

IMAGE_MODEL = "gpt-image-2.5-flare"

client = OpenAI()


def safety_identifier_for(customer_id: str) -> str:
    """Return the stable, non-identifying ID that OpenAI sees for a customer.

    To attribute a flagged identifier, compare it against this value for your customers.
    """
    if not customer_id:
        raise ValueError("customer_id is required so requests can be attributed")
    return hashlib.sha256(customer_id.encode()).hexdigest()


def generate_image(prompt: str, customer_id: str) -> bytes:
    """Generate an image for a signed-in customer and return its PNG bytes."""
    result = client.images.generate(
        model=IMAGE_MODEL,
        prompt=prompt,
        safety_identifier=safety_identifier_for(customer_id),
    )
    # GPT image models always return base64, never a URL.
    return base64.b64decode(result.data[0].b64_json)
