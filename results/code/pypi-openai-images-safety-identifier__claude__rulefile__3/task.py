import base64
import hashlib

from openai import OpenAI

client = OpenAI()  # reads OPENAI_API_KEY from the environment


def generate_image(prompt: str, customer_id: str, *, model: str = "gpt-image-2", size: str = "1024x1024") -> bytes:
    """Generate an image for a signed-in customer and return the PNG bytes.

    The customer ID is sent as `safety_identifier` (the current replacement for
    the deprecated `user` parameter) so OpenAI can attribute abusive requests
    to that customer. It is hashed so no raw PII leaves our system; the same
    customer always maps to the same value, and we can recompute the hash to
    look up who an OpenAI report refers to.
    """
    if not customer_id:
        raise ValueError("customer_id is required")

    safety_identifier = hashlib.sha256(customer_id.encode()).hexdigest()

    response = client.images.generate(
        model=model,
        prompt=prompt,
        size=size,
        output_format="png",
        safety_identifier=safety_identifier,
    )
    # GPT image models always return base64 (no response_format / URL).
    return base64.b64decode(response.data[0].b64_json)
