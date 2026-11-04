from typing import Annotated

from fastapi import FastAPI, Query

app = FastAPI()


@app.get("/users")
async def get_users(
    email: Annotated[str | None, Query(json_schema_extra={"pii": True})] = None,
) -> list[dict[str, str]]:
    users = [{"email": "alice@example.com"}, {"email": "bob@example.com"}]
    if email is not None:
        return [user for user in users if user["email"] == email]
    return users
