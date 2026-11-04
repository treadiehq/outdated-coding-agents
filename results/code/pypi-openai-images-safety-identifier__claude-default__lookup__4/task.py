import base64
import hashlib

from openai import OpenAI

client = OpenAI()


def generate_image(prompt: str, customer_id: str) -> bytes:
    """Generate an image for a signed-in customer and return its PNG bytes.

    The customer ID is sent as a SHA-256 hash, so OpenAI gets a stable identifier
    without the raw ID. To attribute a flagged request, hash your customer IDs
    and match them against the reported value.
    """
    # The API accepts an empty identifier, which would leave the request unattributed.
    if not customer_id:
        raise ValueError("customer_id is required")

    result = client.images.generate(
        model="gpt-image-2.5-flare",
        prompt=prompt,
        safety_identifier=hashlib.sha256(customer_id.encode()).hexdigest(),
    )

    # GPT image models always return base64-encoded images.
    return base64.b64decode(result.data[0].b64_json)
