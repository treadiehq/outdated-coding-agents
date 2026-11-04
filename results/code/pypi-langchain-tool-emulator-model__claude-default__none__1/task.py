"""LangChain agent for integration tests, with every tool call emulated by an LLM."""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool
from langchain_anthropic import ChatAnthropic

AGENT_MODEL = "anthropic:claude-opus-5-5"
EMULATOR_MODEL = "claude-haiku-5-5"


@tool
def get_weather(location: str) -> str:
    """Get the current weather for a location.

    Args:
        location: City name, optionally with a region or country.

    Returns:
        The temperature in Celsius and a short description of the conditions.
    """
    raise NotImplementedError("get_weather should be answered by LLMToolEmulator")


@tool
def search_db(query: str, limit: int = 5) -> str:
    """Search the product database.

    Args:
        query: Keywords to search for.
        limit: Maximum number of records to return.

    Returns:
        A JSON array of matching records with `id`, `name`, and `price` fields.
    """
    raise NotImplementedError("search_db should be answered by LLMToolEmulator")


def build_agent():
    """Create the agent. No tool body runs; the emulator LLM answers each call."""
    # Pass an instance rather than a model string: with a string, LLMToolEmulator
    # sets temperature=1, which Haiku 5.5 says to omit. Thinking must be off because
    # the emulator copies response.content into the ToolMessage as is, and thinking
    # blocks aren't valid inside a tool_result.
    emulator_model = ChatAnthropic(
        model=EMULATOR_MODEL,
        thinking={"type": "disabled"},
    )
    return create_agent(
        model=AGENT_MODEL,
        tools=[get_weather, search_db],
        system_prompt="You are a helpful assistant. Use the tools to answer questions.",
        middleware=[LLMToolEmulator(model=emulator_model)],
    )


if __name__ == "__main__":
    agent = build_agent()
    result = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": "What's the weather in Paris, and which umbrellas do we sell?",
                }
            ]
        }
    )
    for message in result["messages"]:
        message.pretty_print()
