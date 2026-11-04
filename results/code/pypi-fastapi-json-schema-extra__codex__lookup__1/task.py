from typing import Annotated

from fastapi import FastAPI, Query

app = FastAPI()


@app.get("/users")
async def get_users(
    email: Annotated[str | None, Query(json_schema_extra={"pii": True})] = None,
):
    return {"email": email}
