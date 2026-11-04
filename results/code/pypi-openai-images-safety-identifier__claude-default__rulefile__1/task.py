import base64

from openai import OpenAI

IMAGE_MODEL = "gpt-image-2.5-flare"
MAX_SAFETY_IDENTIFIER_LENGTH = 128


def generate_image(client: OpenAI, prompt: str, customer_id: str) -> bytes:
    """Generate an image for a signed-in customer and return its PNG bytes.

    `customer_id` must be a stable, opaque ID. Hash it first if it contains
    identifying information, such as an email address or username.
    """
    # An empty identifier would be accepted by the API but leave the request unattributed.
    if not customer_id or len(customer_id) > MAX_SAFETY_IDENTIFIER_LENGTH:
        raise ValueError(f"customer_id must be 1-{MAX_SAFETY_IDENTIFIER_LENGTH} characters")

    result = client.images.generate(
        model=IMAGE_MODEL,
        prompt=prompt,
        output_format="png",
        safety_identifier=customer_id,
    )

    if not result.data or not result.data[0].b64_json:
        raise RuntimeError("Image API response did not include image data")
    return base64.b64decode(result.data[0].b64_json)
