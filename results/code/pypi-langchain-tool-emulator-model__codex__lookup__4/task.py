"""Integration-test agent with LLM-emulated tools.

Set ANTHROPIC_API_KEY before running `.venv/bin/python task.py`.
Tool results are synthetic; the agent and emulator still make real LLM calls.
Middleware docs: https://docs.langchain.com/oss/python/langchain/middleware/built-in#llm-tool-emulator
"""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool


@tool
def get_weather(location: str) -> str:
    """Get current weather for a city, including conditions and temperature in Celsius."""
    raise RuntimeError("get_weather must be intercepted by LLMToolEmulator")


@tool
def search_db(query: str) -> str:
    """Search the database using a natural-language query and return matching records."""
    raise RuntimeError("search_db must be intercepted by LLMToolEmulator")


def build_agent(
    model: str = "anthropic:claude-sonnet-4-5-20250929",
    *,
    emulator_model: str | None = None,
):
    """Create a fresh test agent; optionally use a separate emulation model."""
    return create_agent(
        model=model,
        tools=[get_weather, search_db],
        middleware=[
            LLMToolEmulator(
                tools=[get_weather, search_db],
                # The installed version deprecates the implicit model default.
                model=emulator_model if emulator_model is not None else model,
            )
        ],
        system_prompt=(
            "You are an integration-test assistant. Use get_weather for weather "
            "requests and search_db for database queries. Tool results are "
            "synthetic test data; summarize them without presenting them as live data."
        ),
    )


if __name__ == "__main__":
    agent = build_agent()
    result = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": (
                        "Get the weather in Toronto and search the database for "
                        "outdoor activities in Toronto, then summarize both results."
                    ),
                }
            ]
        }
    )
    print(result["messages"][-1].content)
