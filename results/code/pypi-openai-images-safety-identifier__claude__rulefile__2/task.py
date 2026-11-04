import base64
import hashlib

from openai import OpenAI

client = OpenAI()  # reads OPENAI_API_KEY from the environment


def generate_image(prompt: str, customer_id: str, *, model: str = "gpt-image-2", size: str = "1024x1024") -> bytes:
    """Generate an image for a signed-in customer and return the raw image bytes.

    The customer's ID is sent as `safety_identifier` (the replacement for the
    deprecated `user` parameter) so OpenAI can attribute abusive requests to
    that customer. It is hashed so the raw ID is never sent; the hash is stable,
    so you can compute it yourself to look a customer up from an abuse report.
    """
    if not customer_id:
        raise ValueError("customer_id is required")

    safety_identifier = hashlib.sha256(customer_id.encode("utf-8")).hexdigest()

    response = client.images.generate(
        model=model,
        prompt=prompt,
        size=size,
        safety_identifier=safety_identifier,
    )
    # GPT image models always return base64-encoded images.
    return base64.b64decode(response.data[0].b64_json)
