"""LangChain agent for integration tests, with tool calls answered by an LLM.

Requires ANTHROPIC_API_KEY. The tools never run: LLMToolEmulator intercepts each
call and has `EMULATOR_MODEL` generate the result from the tool's name,
description and arguments.
"""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool

AGENT_MODEL = "anthropic:claude-opus-5-5"
# Always pass the emulator a model: its implicit default is deprecated.
EMULATOR_MODEL = "anthropic:claude-haiku-5-5"


@tool
def get_weather(location: str) -> str:
    """Get the current weather for a location.

    Args:
        location: City name, e.g. "Paris, France".
    """
    raise NotImplementedError("get_weather should be emulated, not executed")


@tool
def search_db(query: str, limit: int = 5) -> str:
    """Search the database and return matching records as JSON.

    Args:
        query: Search terms to match against records.
        limit: Maximum number of records to return.
    """
    raise NotImplementedError("search_db should be emulated, not executed")


def build_agent():
    """Create the agent, emulating every tool it is given."""
    return create_agent(
        model=AGENT_MODEL,
        tools=[get_weather, search_db],
        middleware=[LLMToolEmulator(model=EMULATOR_MODEL)],
    )


if __name__ == "__main__":
    result = build_agent().invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": (
                        "What's the weather in Paris, and which customers "
                        "in our database are based there?"
                    ),
                }
            ]
        }
    )
    for message in result["messages"]:
        print(f"{message.type}: {message.text}")
