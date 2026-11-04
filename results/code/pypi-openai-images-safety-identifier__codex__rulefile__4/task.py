"""Generate images with per-customer abuse attribution."""

from openai import OpenAI
from openai.types import ImagesResponse


def generate_image(prompt: str, customer_id: str) -> ImagesResponse:
    """Generate an image for an authenticated customer.

    Supply customer_id from the trusted server-side session, never from an
    unverified request field. Use a stable, opaque internal ID (no email or
    other personal information), at most 128 characters long.

    Reads OPENAI_API_KEY from the environment. Returns the SDK response,
    including the generated image's base64 data.

    API documentation:
    https://developers.openai.com/api/docs/guides/image-generation#safety-identifiers
    """
    if not isinstance(prompt, str) or not prompt.strip():
        raise ValueError("prompt must be a nonempty string")
    if (
        not isinstance(customer_id, str)
        or not customer_id.strip()
        or len(customer_id) > 128
    ):
        raise ValueError("customer_id must be a nonempty string of at most 128 characters")

    with OpenAI() as client:
        return client.images.generate(
            model="gpt-image-2.5-sunburst",
            prompt=prompt,
            n=1,
            safety_identifier=customer_id,
        )
