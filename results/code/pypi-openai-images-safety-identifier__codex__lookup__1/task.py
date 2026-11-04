"""Generate customer images with the official OpenAI Python SDK."""

from hashlib import sha256

from openai import OpenAI
from openai.types import ImagesResponse


def generate_image(
    prompt: str, customer_id: str, *, client: OpenAI | None = None
) -> ImagesResponse:
    """Generate one image, attributing requests to the authenticated customer.

    Supply customer_id from the trusted server-side sign-in session, rather
    than accepting an arbitrary customer ID from the request body. The stable
    hash permits attribution without transmitting the customer's raw ID.
    If no client is supplied, OPENAI_API_KEY configures the SDK client.
    The returned image is in response.data[0].b64_json (base64-encoded PNG).

    API reference: https://developers.openai.com/api/reference/resources/images/methods/generate
    """
    if not prompt.strip():
        raise ValueError("prompt must not be blank")
    if not customer_id.strip():
        raise ValueError("customer_id must identify a signed-in customer")

    safety_identifier = sha256(customer_id.encode("utf-8")).hexdigest()
    options = {
        "model": "gpt-image-2.5-sunburst",
        "prompt": prompt,
        "n": 1,
        "output_format": "png",
        "safety_identifier": safety_identifier,
    }
    if client is not None:
        return client.images.generate(**options)
    with OpenAI() as owned_client:
        return owned_client.images.generate(**options)
