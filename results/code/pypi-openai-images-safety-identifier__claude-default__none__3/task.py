import base64
import hashlib

from openai import OpenAI

client = OpenAI()


def generate_image(prompt: str, customer_id: str) -> bytes:
    """Generate an image for a signed-in customer and return it as PNG bytes.

    `customer_id` must come from the authenticated session, not from client
    input, or abuse could be attributed to the wrong customer.
    """
    if not customer_id:
        # The API accepts an empty identifier, which would leave the request unattributed.
        raise ValueError("customer_id is required")

    # Hashed so the raw ID isn't sent to OpenAI. To trace a flagged identifier
    # back to a customer, apply the same hash to your own customer IDs.
    safety_identifier = hashlib.sha256(customer_id.encode()).hexdigest()

    response = client.images.generate(
        model="gpt-image-2.5-flare",
        prompt=prompt,
        output_format="png",
        safety_identifier=safety_identifier,
    )
    return base64.b64decode(response.data[0].b64_json)
