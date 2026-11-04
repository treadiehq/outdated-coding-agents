from typing import Optional

from fastapi import FastAPI, Query

app = FastAPI()


@app.get("/users")
def get_users(
    email: Optional[str] = Query(
        default=None,
        json_schema_extra={"pii": True},
    ),
):
    return {"users": [], "email": email}
