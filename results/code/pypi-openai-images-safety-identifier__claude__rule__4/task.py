import base64

from openai import OpenAI

client = OpenAI()  # reads OPENAI_API_KEY from the environment


def generate_image(prompt: str, customer_id: str, *, model: str = "gpt-image-1", size: str = "1024x1024") -> bytes:
    """Generate an image for a signed-in customer and return the raw image bytes.

    customer_id is sent as safety_identifier so abusive requests can be
    attributed to the customer. Use a stable, unique ID for each customer
    (ideally a hash of your internal ID rather than an email or name).
    """
    if not customer_id:
        raise ValueError("customer_id is required")

    response = client.images.generate(
        model=model,
        prompt=prompt,
        size=size,
        extra_body={"safety_identifier": customer_id},
    )
    return base64.b64decode(response.data[0].b64_json)
