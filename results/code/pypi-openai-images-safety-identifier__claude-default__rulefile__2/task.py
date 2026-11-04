import base64
import hashlib

from openai import OpenAI


def safety_identifier_for(customer_id: str) -> str:
    """Return the stable, non-identifying ID that OpenAI sees for a customer.

    To trace a flagged identifier back to a customer, run their ID through this
    function and compare the results.
    """
    if not customer_id:
        raise ValueError("customer_id must be non-empty")
    return hashlib.sha256(customer_id.encode("utf-8")).hexdigest()


def generate_image(
    prompt: str,
    customer_id: str,
    *,
    client: OpenAI | None = None,
    model: str = "gpt-image-2",
) -> bytes:
    """Generate an image for a signed-in customer and return its PNG bytes."""
    identifier = safety_identifier_for(customer_id)
    client = client or OpenAI()
    response = client.images.generate(
        model=model,
        prompt=prompt,
        output_format="png",
        safety_identifier=identifier,
    )
    if not response.data or not response.data[0].b64_json:
        raise RuntimeError("OpenAI returned no image data")
    return base64.b64decode(response.data[0].b64_json)
