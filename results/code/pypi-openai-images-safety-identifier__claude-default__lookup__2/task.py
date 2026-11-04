import base64
import hashlib

from openai import OpenAI

client = OpenAI()


def generate_image(prompt: str, customer_id: str) -> bytes:
    """Generate an image for a signed-in customer and return its PNG bytes.

    The customer ID is sent as a SHA-256 hash, so abusive requests can be traced
    back to the customer by hashing the ID again, without sharing the raw ID.
    """
    if not customer_id:
        raise ValueError("customer_id is required to attribute the request")

    result = client.images.generate(
        model="gpt-image-2.5-flare",
        prompt=prompt,
        safety_identifier=hashlib.sha256(customer_id.encode()).hexdigest(),
    )
    return base64.b64decode(result.data[0].b64_json)
