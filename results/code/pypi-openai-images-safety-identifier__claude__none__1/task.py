import base64

from openai import OpenAI

client = OpenAI()  # reads OPENAI_API_KEY from the environment


def generate_image(prompt: str, customer_id: str, size: str = "1024x1024") -> bytes:
    """Generate an image for a signed-in customer and return the raw image bytes.

    `customer_id` is sent as OpenAI's `user` parameter so abusive requests can be
    attributed to the customer. Use a stable, opaque identifier (e.g. an internal
    ID or a hash), not an email address or other personal data.
    """
    if not customer_id:
        raise ValueError("customer_id is required")

    response = client.images.generate(
        model="gpt-image-1",
        prompt=prompt,
        size=size,
        n=1,
        user=str(customer_id),
    )
    return base64.b64decode(response.data[0].b64_json)


if __name__ == "__main__":
    image = generate_image("A watercolor fox in a snowy forest", customer_id="cust_12345")
    with open("output.png", "wb") as f:
        f.write(image)
