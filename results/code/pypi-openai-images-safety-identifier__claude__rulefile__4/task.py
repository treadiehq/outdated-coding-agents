import base64
import hashlib

from openai import OpenAI

client = OpenAI()  # reads OPENAI_API_KEY from the environment


def generate_image(prompt: str, customer_id: str, size: str = "1024x1024") -> bytes:
    """Generate an image for a signed-in customer and return the raw image bytes.

    The customer is identified to OpenAI via `safety_identifier` (which replaces
    the deprecated `user` parameter), so abusive requests can be attributed to
    them. The ID is hashed so no raw email or username is sent; you can compute
    the same hash on your side to map a flagged identifier back to the customer.
    """
    if not customer_id:
        raise ValueError("customer_id is required")

    result = client.images.generate(
        model="gpt-image-2",
        prompt=prompt,
        size=size,
        n=1,
        safety_identifier=safety_identifier(customer_id),
    )
    # GPT image models always return base64 (no `response_format` / `url`).
    return base64.b64decode(result.data[0].b64_json)


def safety_identifier(customer_id: str) -> str:
    return hashlib.sha256(customer_id.encode("utf-8")).hexdigest()
