"""LangChain agent for integration tests, with its tool calls emulated by an LLM.

Requires ANTHROPIC_API_KEY. Run a sample query with `python task.py`.
"""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool

AGENT_MODEL = "anthropic:claude-opus-5-5"

# Must be a model without default-on thinking. LLMToolEmulator copies the response
# content into the ToolMessage unfiltered, so thinking blocks would end up inside the
# tool_result. It also sets temperature=1 on models given by name, which rules out
# models whose profile lists temperature as unsupported.
EMULATOR_MODEL = "anthropic:claude-haiku-4-5"


@tool
def get_weather(location: str) -> str:
    """Get the current weather for a location, including temperature and conditions.

    Args:
        location: City and country, e.g. "Paris, France".
    """
    raise NotImplementedError("get_weather should be emulated by LLMToolEmulator")


@tool
def search_db(query: str, limit: int = 5) -> str:
    """Search the customer records database and return matching rows as JSON.

    Args:
        query: Free-text search query.
        limit: Maximum number of rows to return.
    """
    raise NotImplementedError("search_db should be emulated by LLMToolEmulator")


def build_agent():
    """Create the agent, with every tool call answered by the emulator model."""
    return create_agent(
        model=AGENT_MODEL,
        tools=[get_weather, search_db],
        system_prompt="You are a helpful assistant. Use the available tools to answer.",
        middleware=[LLMToolEmulator(model=EMULATOR_MODEL)],
    )


if __name__ == "__main__":
    result = build_agent().invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": "What's the weather in Paris? Also find customers named Smith.",
                }
            ]
        }
    )
    for message in result["messages"]:
        message.pretty_print()
