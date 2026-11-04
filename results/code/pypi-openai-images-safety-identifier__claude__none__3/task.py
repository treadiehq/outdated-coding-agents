from openai import OpenAI

client = OpenAI()  # reads OPENAI_API_KEY from the environment


def generate_image(prompt: str, customer_id: str, size: str = "1024x1024") -> str:
    """Generate an image for a signed-in customer and return its base64 data.

    The customer's ID is sent as the `user` parameter so OpenAI can attribute
    abusive requests to a specific end user. Use a stable, opaque identifier
    (e.g. an internal user ID or a hash), not an email or other PII.
    """
    if not customer_id:
        raise ValueError("customer_id is required")

    result = client.images.generate(
        model="gpt-image-1",
        prompt=prompt,
        size=size,
        n=1,
        user=str(customer_id),
    )
    return result.data[0].b64_json


if __name__ == "__main__":
    import base64

    image_b64 = generate_image("A watercolor fox in a forest", customer_id="cust_12345")
    with open("output.png", "wb") as f:
        f.write(base64.b64decode(image_b64))
