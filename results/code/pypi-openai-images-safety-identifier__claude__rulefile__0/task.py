import base64
import hashlib

from openai import OpenAI

client = OpenAI()  # reads OPENAI_API_KEY from the environment


def generate_image(prompt: str, customer_id: str, size: str = "1024x1024") -> bytes:
    """Generate an image for a signed-in customer and return the PNG bytes.

    The customer's ID is sent as `safety_identifier` (the current replacement for
    the deprecated `user` parameter) so OpenAI can attribute abusive requests to
    that customer. It is hashed so no raw email/username leaves our systems; the
    hash is stable, so we can recompute it to map a flagged ID back to a customer.
    """
    if not customer_id:
        raise ValueError("customer_id is required")

    safety_identifier = hashlib.sha256(customer_id.encode("utf-8")).hexdigest()

    result = client.images.generate(
        model="gpt-image-2",
        prompt=prompt,
        size=size,
        output_format="png",
        safety_identifier=safety_identifier,
    )
    # GPT image models always return base64 data.
    return base64.b64decode(result.data[0].b64_json)
