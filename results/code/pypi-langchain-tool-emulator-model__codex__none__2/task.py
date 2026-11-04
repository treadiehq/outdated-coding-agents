"""Integration-test agent with LLM-emulated tools.

Set ANTHROPIC_API_KEY before running this file. Tool outputs are synthetic;
the agent and emulator still make real LLM requests.
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


def build_agent(model="anthropic:claude-sonnet-4-5-20250929", emulator_model=None):
    """Build an agent; model arguments accept model identifiers or chat models."""
    return create_agent(
        model=model,
        tools=[get_weather, search_db],
        middleware=[
            LLMToolEmulator(
                tools=[get_weather, search_db],
                model=emulator_model if emulator_model is not None else model,
            )
        ],
        system_prompt=(
            "You are an integration-test assistant. Use get_weather for weather "
            "questions and search_db for database queries. Tool responses are "
            "synthetic test data; describe results accordingly."
        ),
    )


if __name__ == "__main__":
    agent = build_agent()
    result = agent.invoke(
        {"messages": [{"role": "user", "content": (
            "Get the current weather in Toronto and search the database for "
            "outdoor activities in Toronto. Summarize both results."
        )}]}
    )
    print(result["messages"][-1].content)
