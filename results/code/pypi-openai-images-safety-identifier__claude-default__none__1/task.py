import base64
import hashlib

from openai import OpenAI

IMAGE_MODEL = "gpt-image-2.5-sunburst"


def safety_identifier_for(customer_id: str) -> str:
    """Return the stable, non-identifying ID that OpenAI sees for a customer.

    To trace an abuse report back to a customer, run their ID through this
    function and compare the result with the identifier in the report.
    """
    if not customer_id:
        # An empty ID would attribute every such request to the same "customer".
        raise ValueError("customer_id must be a non-empty string")
    return hashlib.sha256(customer_id.encode("utf-8")).hexdigest()


def generate_image(client: OpenAI, prompt: str, customer_id: str) -> bytes:
    """Generate an image for a signed-in customer and return its PNG bytes.

    customer_id must come from the authenticated session, not from request
    input, or abuse could be attributed to the wrong customer.
    """
    response = client.images.generate(
        model=IMAGE_MODEL,
        prompt=prompt,
        output_format="png",
        safety_identifier=safety_identifier_for(customer_id),
    )
    if not response.data or not response.data[0].b64_json:
        raise RuntimeError("OpenAI returned no image data")
    return base64.b64decode(response.data[0].b64_json)
