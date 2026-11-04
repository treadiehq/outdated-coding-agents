import base64
import hashlib

from openai import OpenAI

client = OpenAI()


def generate_image(prompt: str, customer_id: str) -> bytes:
    """Generate a PNG from `prompt` on behalf of the signed-in customer `customer_id`."""
    if not customer_id:
        raise ValueError("customer_id is required to attribute the request")

    # Hashed so the raw ID never reaches OpenAI. The hash is stable, so a flagged
    # identifier can be traced back by hashing the customer ID on our side.
    safety_identifier = hashlib.sha256(customer_id.encode()).hexdigest()

    response = client.images.generate(
        model="gpt-image-2.5-flare",
        prompt=prompt,
        output_format="png",
        safety_identifier=safety_identifier,
    )

    if not response.data or not response.data[0].b64_json:
        raise RuntimeError("OpenAI returned no image data")
    return base64.b64decode(response.data[0].b64_json)
