import base64

from openai import OpenAI

client = OpenAI()  # reads OPENAI_API_KEY from the environment


def generate_image(prompt: str, customer_id: str, *, model: str = "gpt-image-1", size: str = "1024x1024") -> bytes:
    """Generate an image for a signed-in customer and return the raw image bytes.

    `customer_id` is sent as the API's `user` field so OpenAI can attribute
    abusive requests to the customer. Use a stable, opaque identifier (e.g. an
    internal user ID or a hash), not an email address or other PII.
    """
    if not customer_id:
        raise ValueError("customer_id is required")

    response = client.images.generate(
        model=model,
        prompt=prompt,
        size=size,
        n=1,
        user=str(customer_id),
    )
    # GPT image models always return base64-encoded image data.
    return base64.b64decode(response.data[0].b64_json)
