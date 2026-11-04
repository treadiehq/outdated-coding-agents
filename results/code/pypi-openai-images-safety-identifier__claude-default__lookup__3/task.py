import base64

from openai import OpenAI


def generate_image(client: OpenAI, prompt: str, customer_id: str) -> bytes:
    """Generate an image for a signed-in customer and return it as PNG bytes.

    `customer_id` is sent as `safety_identifier` so OpenAI can attribute abusive
    requests to that customer. It must be stable and must not contain personal
    data such as an email address; hash such values before passing them in.
    """
    # The API treats an empty identifier as absent, which would lose attribution.
    if not customer_id:
        raise ValueError("customer_id is required")

    response = client.images.generate(
        model="gpt-image-2.5-flare",
        prompt=prompt,
        output_format="png",
        safety_identifier=customer_id,
    )

    if not response.data or not response.data[0].b64_json:
        raise RuntimeError("OpenAI returned no image data")
    return base64.b64decode(response.data[0].b64_json)
