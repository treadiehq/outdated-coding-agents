from typing import Annotated

from fastapi import FastAPI, Query

app = FastAPI()


@app.get("/users")
def get_users(
    email: Annotated[str | None, Query(json_schema_extra={"pii": True})] = None,
):
    users = [{"id": 1, "email": "alice@example.com"}]
    if email is not None:
        return [user for user in users if user["email"] == email]
    return users
