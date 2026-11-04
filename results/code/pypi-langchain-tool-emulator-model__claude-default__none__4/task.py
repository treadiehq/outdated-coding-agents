"""LangChain agent for integration tests, with tool calls answered by an LLM.

Requires ANTHROPIC_API_KEY. Emulated output varies between runs, so tests should
assert on agent behavior (which tools were called, with what arguments) rather
than on exact tool results.
"""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool
from langchain_anthropic import ChatAnthropic

AGENT_MODEL = "anthropic:claude-opus-5-5"
EMULATOR_MODEL = "claude-haiku-5-5"


@tool
def get_weather(location: str) -> str:
    """Get the current weather for a location.

    Returns the temperature, conditions, humidity, and wind speed as JSON.

    Args:
        location: City name, e.g. "Paris, France".
    """
    raise NotImplementedError("get_weather must be emulated by LLMToolEmulator")


@tool
def search_db(query: str, limit: int = 10) -> str:
    """Search the database for records matching a query.

    Returns a JSON list of matching records, each with an id, title, and summary.

    Args:
        query: Free-text search query.
        limit: Maximum number of records to return.
    """
    raise NotImplementedError("search_db must be emulated by LLMToolEmulator")


def build_agent():
    """Create the agent with every tool call routed to the emulator LLM."""
    # Pass a model instance, not a string: LLMToolEmulator adds temperature=1 to
    # string models, which the 5.x models don't list as supported. Thinking is off
    # because the emulator copies response.content into the ToolMessage verbatim,
    # and thinking blocks aren't valid inside a tool result.
    emulator_model = ChatAnthropic(
        model=EMULATOR_MODEL,
        thinking={"type": "disabled"},
    )
    return create_agent(
        model=AGENT_MODEL,
        tools=[get_weather, search_db],
        system_prompt="You are a helpful assistant. Use your tools to answer.",
        # tools=None (the default) emulates all tools, so one added later can't
        # really execute during a test run.
        middleware=[LLMToolEmulator(model=emulator_model)],
    )


if __name__ == "__main__":
    agent = build_agent()
    result = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": "What's the weather in Paris? Also search the "
                    "database for records about Paris.",
                }
            ]
        }
    )
    for message in result["messages"]:
        message.pretty_print()
