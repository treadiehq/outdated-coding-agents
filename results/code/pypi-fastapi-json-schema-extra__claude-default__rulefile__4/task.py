from typing import Annotated

from fastapi import FastAPI, Query

app = FastAPI()

USERS = [
    {"id": 1, "email": "alice@example.com"},
    {"id": 2, "email": "bob@example.com"},
]


@app.get("/users")
def list_users(
    email: Annotated[str | None, Query(json_schema_extra={"pii": True})] = None,
) -> list[dict[str, int | str]]:
    if email is None:
        return USERS
    return [user for user in USERS if user["email"] == email]
