import base64
import hashlib

from openai import OpenAI

client = OpenAI()  # reads OPENAI_API_KEY from the environment

IMAGE_MODEL = "gpt-image-2"


def _safety_identifier(customer_id: str) -> str:
    # Stable per customer, but doesn't send the raw ID/email to OpenAI.
    return hashlib.sha256(customer_id.encode("utf-8")).hexdigest()


def generate_image(prompt: str, customer_id: str, size: str = "1024x1024") -> bytes:
    """Generate an image for a signed-in customer and return the PNG bytes.

    customer_id is sent as `safety_identifier` (the replacement for the
    deprecated `user` parameter) so OpenAI can attribute abusive requests to
    this customer. Keep your own mapping from the hash back to the customer.
    """
    if not customer_id:
        raise ValueError("customer_id is required")

    response = client.images.generate(
        model=IMAGE_MODEL,
        prompt=prompt,
        size=size,
        output_format="png",
        safety_identifier=_safety_identifier(customer_id),
    )
    # GPT image models always return base64 (no `url`/`response_format`).
    return base64.b64decode(response.data[0].b64_json)
