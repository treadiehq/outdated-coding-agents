"""Integration-test agent with LLM-emulated tools.

Run with ANTHROPIC_API_KEY set: .venv/bin/python task.py
Only the agent and emulator make model API calls; no weather service or database
is accessed. Emulated outputs vary and should not be asserted verbatim in tests.
"""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool
from langchain_core.language_models import BaseChatModel


DEFAULT_MODEL = "anthropic:claude-sonnet-4-5-20250929"


@tool
def get_weather(location: str) -> str:
    """Get current weather for a city, including conditions and temperature in Celsius."""
    raise AssertionError("get_weather must be intercepted by LLMToolEmulator")


@tool
def search_db(query: str) -> str:
    """Search the database with a natural-language query and return matching records."""
    raise AssertionError("search_db must be intercepted by LLMToolEmulator")


def build_agent(
    model: str | BaseChatModel = DEFAULT_MODEL,
    *,
    emulator_model: str | BaseChatModel | None = None,
):
    """Build an agent; callers may inject separate agent and emulation models."""
    return create_agent(
        model=model,
        tools=[get_weather, search_db],
        middleware=[
            LLMToolEmulator(
                tools=["get_weather", "search_db"],
                model=model if emulator_model is None else emulator_model,
            )
        ],
        system_prompt=(
            "You are an assistant in an integration-test environment. "
            "Use get_weather for weather questions and search_db for database "
            "questions. Tool results are simulated test data."
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
                        "outdoor events in Toronto. Summarize both results."
                    ),
                }
            ]
        },
        config={"recursion_limit": 20},
    )
    print(result["messages"][-1].content)
