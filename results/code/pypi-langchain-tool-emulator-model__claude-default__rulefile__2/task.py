"""LangChain agent for integration tests, with tool calls answered by an LLM."""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool
from langchain_anthropic import ChatAnthropic

AGENT_MODEL = "claude-opus-5-5"
EMULATOR_MODEL = "claude-haiku-5-5"


# The emulator never runs these bodies, so reaching one means emulation was bypassed.
# It does read the docstrings, which shape the responses it generates.
@tool
def get_weather(location: str) -> str:
    """Get the current weather for a location, including temperature and conditions.

    Args:
        location: City name, for example "Paris, France".
    """
    raise NotImplementedError("get_weather should be answered by LLMToolEmulator")


@tool
def search_db(query: str, limit: int = 5) -> str:
    """Search the database and return matching records as a JSON array.

    Args:
        query: Search terms to match against records.
        limit: Maximum number of records to return.
    """
    raise NotImplementedError("search_db should be answered by LLMToolEmulator")


def build_agent():
    """Create the agent, with every tool call emulated instead of executed."""
    # The emulator copies the model's response content into the ToolMessage as is, so
    # thinking is disabled to keep thinking blocks out of the tool result. Passing an
    # instance also avoids the temperature=1 the emulator sets on model strings.
    emulator_model = ChatAnthropic(
        model=EMULATOR_MODEL,
        max_tokens=1024,
        thinking={"type": "disabled"},
    )
    return create_agent(
        model=ChatAnthropic(model=AGENT_MODEL, max_tokens=8192),
        tools=[get_weather, search_db],
        system_prompt="You are a helpful assistant. Use your tools to answer questions.",
        middleware=[LLMToolEmulator(model=emulator_model)],
    )


if __name__ == "__main__":
    result = build_agent().invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": "What's the weather in Paris? Also search the db for open orders.",
                }
            ]
        }
    )
    for message in result["messages"]:
        message.pretty_print()
