import base64
import hashlib

from openai import OpenAI

client = OpenAI()


def generate_image(prompt: str, customer_id: str) -> bytes:
    """Generate an image for a signed-in customer and return its PNG bytes."""
    # The API silently drops an empty identifier, which would leave the request unattributed.
    if not customer_id:
        raise ValueError("customer_id is required")

    response = client.images.generate(
        model="gpt-image-2.5-flare",
        prompt=prompt,
        output_format="png",
        # Hashed so no identifying information is sent; hash a customer's ID the same way to match it to a report.
        safety_identifier=hashlib.sha256(customer_id.encode()).hexdigest(),
    )

    if not response.data or not response.data[0].b64_json:
        raise RuntimeError("OpenAI returned no image data")
    return base64.b64decode(response.data[0].b64_json)
