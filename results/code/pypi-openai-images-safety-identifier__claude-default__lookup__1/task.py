import base64
import hashlib

from openai import OpenAI

client = OpenAI()  # Reads OPENAI_API_KEY from the environment.


def safety_identifier_for(customer_id: str) -> str:
    """Return the stable, non-identifying value OpenAI receives for a customer.

    To trace a flagged identifier back to a customer, compute this for the
    customer ID and compare, or store the value alongside the customer record.
    """
    return hashlib.sha256(customer_id.encode("utf-8")).hexdigest()


def generate_image(prompt: str, customer_id: str, model: str = "gpt-image-2.5-sunburst") -> bytes:
    """Generate an image for a signed-in customer and return its encoded bytes (PNG by default)."""
    # The API treats an empty identifier as omitted, which would leave the request unattributed.
    if not customer_id:
        raise ValueError("customer_id is required")

    response = client.images.generate(
        model=model,
        prompt=prompt,
        safety_identifier=safety_identifier_for(customer_id),
    )

    if not response.data or not response.data[0].b64_json:
        raise RuntimeError("OpenAI response did not include image data")
    return base64.b64decode(response.data[0].b64_json)
