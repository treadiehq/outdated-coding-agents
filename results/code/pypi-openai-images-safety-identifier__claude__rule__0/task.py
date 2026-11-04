from openai import OpenAI

client = OpenAI()  # reads OPENAI_API_KEY from the environment


def generate_image(prompt: str, customer_id: str, model: str = "gpt-image-1", size: str = "1024x1024") -> str:
    """Generate an image for a signed-in customer and return it as base64.

    customer_id should be a stable, unique identifier for the customer (ideally
    a hashed value, not an email or name). It is sent as safety_identifier so
    abusive requests can be attributed to that customer.
    """
    response = client.images.generate(
        model=model,
        prompt=prompt,
        size=size,
        n=1,
        safety_identifier=customer_id,
    )
    return response.data[0].b64_json
