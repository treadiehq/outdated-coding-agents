from typing import Annotated

from fastapi import FastAPI, Query

app = FastAPI()

USERS = [
    {"id": 1, "email": "ada@example.com"},
    {"id": 2, "email": "grace@example.com"},
]


@app.get("/users")
def get_users(
    email: Annotated[str | None, Query(json_schema_extra={"pii": True})] = None,
):
    if email is None:
        return USERS
    return [user for user in USERS if user["email"] == email]
