from openai import OpenAI

client = OpenAI()  # reads OPENAI_API_KEY from the environment


def generate_image(prompt: str, customer_id: str) -> str:
    """Generate an image for a signed-in customer and return it as base64.

    customer_id is sent as safety_identifier so abusive requests can be
    attributed to the customer. Use a stable, unique ID (ideally a hash of
    your internal ID, not an email or other PII).
    """
    result = client.images.generate(
        model="gpt-image-1",
        prompt=prompt,
        size="1024x1024",
        safety_identifier=customer_id,
    )
    return result.data[0].b64_json
