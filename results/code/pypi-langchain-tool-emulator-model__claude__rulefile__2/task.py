"""Agent for integration tests: tool calls are emulated by an LLM, not executed."""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool

AGENT_MODEL = "anthropic:claude-sonnet-5-5"
EMULATOR_MODEL = "anthropic:claude-haiku-5-5"


@tool
def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    raise RuntimeError("Real get_weather must not run in tests")


@tool
def search_db(query: str) -> str:
    """Search the database for records matching a query."""
    raise RuntimeError("Real search_db must not run in tests")


def build_agent():
    return create_agent(
        model=AGENT_MODEL,
        tools=[get_weather, search_db],
        # tools=None would emulate all tools; listed explicitly for clarity.
        # `model` is passed explicitly because the implicit default is deprecated.
        middleware=[
            LLMToolEmulator(tools=[get_weather, search_db], model=EMULATOR_MODEL)
        ],
    )


if __name__ == "__main__":
    agent = build_agent()
    result = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": "What's the weather in Paris, and find orders for customer 42 in the database.",
                }
            ]
        }
    )
    for message in result["messages"]:
        message.pretty_print()
