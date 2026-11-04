"""Image generation using the official OpenAI Python SDK."""

from openai import OpenAI
from openai.types import ImagesResponse


def generate_image(
    prompt: str, customer_id: str, *, client: OpenAI
) -> ImagesResponse:
    """Generate an image attributed to the signed-in customer.

    Pass a stable, opaque customer ID from your server's authenticated session,
    rather than an ID supplied in the request body or an email address.
    The client can be created with OpenAI(), using OPENAI_API_KEY.
    The returned response contains the image in data[0].b64_json.

    API reference (user is deprecated in favor of safety_identifier):
    https://developers.openai.com/api/reference/resources/images/methods/generate
    """
    if not prompt.strip():
        raise ValueError("prompt must not be empty")
    if not customer_id.strip():
        raise ValueError("customer_id must not be empty")

    return client.images.generate(
        model="gpt-image-2.5-flare",
        prompt=prompt,
        safety_identifier=customer_id,
        n=1,
        output_format="png",
    )
