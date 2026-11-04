"""Generate customer-attributed images using the official OpenAI SDK."""

from openai import OpenAI
from openai.types import ImagesResponse


def generate_image(
    prompt: str,
    customer_id: str,
    *,
    client: OpenAI | None = None,
) -> ImagesResponse:
    """Generate one image and return its SDK response (including base64 data).

    Obtain customer_id from the authenticated server-side session, rather than
    accepting an arbitrary ID from the request body. Use a stable, opaque ID
    (or a hash if your IDs contain personal information), at most 128 characters.
    Without an injected client, authentication uses OPENAI_API_KEY.

    API reference:
    https://developers.openai.com/api/reference/python/resources/images/methods/generate
    """
    if not isinstance(prompt, str) or not prompt.strip():
        raise ValueError("prompt must be a non-empty string")
    if (
        not isinstance(customer_id, str)
        or not customer_id.strip()
        or len(customer_id) > 128
    ):
        raise ValueError("customer_id must be a non-empty string of at most 128 characters")

    def generate(api: OpenAI) -> ImagesResponse:
        return api.images.generate(
            model="gpt-image-2.5-flare",
            prompt=prompt,
            n=1,
            safety_identifier=customer_id,
        )

    if client is not None:
        return generate(client)
    with OpenAI() as api:
        return generate(api)
