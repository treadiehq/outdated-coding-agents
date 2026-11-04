"""LangChain agent for integration tests, with tool calls answered by an LLM."""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool

AGENT_MODEL = "anthropic:claude-opus-5-5"
EMULATOR_MODEL = "anthropic:claude-sonnet-5-5"


# The emulator never runs these bodies. It sends the tool's name, description
# and arguments to the LLM, so the docstrings shape the emulated responses.
@tool
def get_weather(location: str) -> str:
    """Get the current weather for a location, including temperature and conditions."""
    raise NotImplementedError("get_weather should be emulated, not executed")


@tool
def search_db(query: str) -> str:
    """Search the database and return the records matching a query."""
    raise NotImplementedError("search_db should be emulated, not executed")


def build_agent():
    """Create an agent whose tool calls are all emulated by an LLM."""
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
                    "content": "What's the weather in Paris, and which orders "
                    "in the database shipped there last week?",
                }
            ]
        }
    )
    for message in result["messages"]:
        message.pretty_print()
