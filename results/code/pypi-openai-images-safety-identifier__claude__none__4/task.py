from openai import OpenAI

client = OpenAI()  # reads OPENAI_API_KEY from the environment


def generate_image(prompt: str, customer_id: str, size: str = "1024x1024") -> str:
    """Generate an image for a signed-in customer and return its URL.

    customer_id is sent as the `user` parameter so OpenAI can attribute
    abusive requests to the specific end user. Use a stable, opaque
    identifier (e.g. an internal ID or a hash), not raw PII like an email.
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


if __name__ == "__main__":
    print(generate_image("A watercolor lighthouse at dawn", customer_id="cust_12345"))
