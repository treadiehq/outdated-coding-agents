"""Agent for integration tests: tool calls are answered by an LLM, not executed."""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool

AGENT_MODEL = "anthropic:claude-sonnet-5-5"
EMULATOR_MODEL = "anthropic:claude-haiku-5-5"


@tool
def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    raise RuntimeError("get_weather must not run for real in integration tests")


@tool
def search_db(query: str) -> str:
    """Search the database for records matching a query."""
    raise RuntimeError("search_db must not run for real in integration tests")


def build_agent():
    return create_agent(
        model=AGENT_MODEL,
        tools=[get_weather, search_db],
        middleware=[LLMToolEmulator(model=EMULATOR_MODEL)],  # tools=None -> emulate all
    )


if __name__ == "__main__":
    agent = build_agent()
    result = agent.invoke(
        {"messages": [{"role": "user", "content": "What's the weather in Paris, and find orders for customer 42."}]}
    )
    print(result["messages"][-1].content)
