"""LangChain agent for integration tests, with tool calls emulated by an LLM.

`LLMToolEmulator` intercepts every tool call and asks a model to generate the
result, so the tools below never execute. The emulator only sees each tool's name,
description, and arguments, so the docstrings determine how realistic results are.

Requires `ANTHROPIC_API_KEY` to be set.
"""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool
from langchain_anthropic import ChatAnthropic

AGENT_MODEL = "claude-opus-5-5"
EMULATOR_MODEL = "claude-haiku-5-5"

SYSTEM_PROMPT = "You are a helpful assistant. Use the available tools to answer questions."


@tool
def get_weather(location: str) -> str:
    """Get the current weather for a location.

    Args:
        location: City name, optionally with region or country, e.g. "Paris, France".

    Returns:
        The current conditions, temperature in Celsius, humidity, and wind speed.
    """
    raise NotImplementedError("get_weather should be emulated by LLMToolEmulator")


@tool
def search_db(query: str, limit: int = 5) -> str:
    """Search the customer database for matching records.

    Args:
        query: Free-text search over customer names, emails, and companies.
        limit: Maximum number of records to return.

    Returns:
        A JSON array of records with `id`, `name`, `email`, and `company` fields.
    """
    raise NotImplementedError("search_db should be emulated by LLMToolEmulator")


def build_agent():
    """Create an agent whose tool calls are all answered by the emulator model."""
    return create_agent(
        model=ChatAnthropic(model=AGENT_MODEL),
        tools=[get_weather, search_db],
        system_prompt=SYSTEM_PROMPT,
        # Pass an instance: given a model string, the emulator forces `temperature=1`.
        middleware=[LLMToolEmulator(model=ChatAnthropic(model=EMULATOR_MODEL))],
    )


if __name__ == "__main__":
    result = build_agent().invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": "What's the weather in Paris, and which customers work at Acme?",
                }
            ]
        }
    )
    for message in result["messages"]:
        message.pretty_print()
