from openai import OpenAI

client = OpenAI()  # reads OPENAI_API_KEY from the environment


def generate_image(prompt: str, customer_id: str, size: str = "1024x1024") -> str:
    """Generate an image for a signed-in customer and return its URL.

    The customer's ID is sent as the `user` parameter so OpenAI can attribute
    abusive requests to that customer. Use a stable, opaque identifier (e.g. an
    internal user ID or a hash), not an email address or other PII.
    """
    if not customer_id:
        raise ValueError("customer_id is required")

    response = client.images.generate(
        model="dall-e-3",
        prompt=prompt,
        size=size,
        n=1,
        user=str(customer_id),
    )
    return response.data[0].url
