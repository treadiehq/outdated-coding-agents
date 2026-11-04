"""LangChain agent for integration tests, with tool calls answered by an LLM."""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool
from langchain_anthropic import ChatAnthropic

AGENT_MODEL = "claude-opus-5-5"
EMULATOR_MODEL = "claude-haiku-5-5"


@tool
def get_weather(location: str) -> str:
    """Get the current weather for a location.

    Args:
        location: City name, for example "Paris, France".
    """
    raise NotImplementedError("get_weather should be emulated, not executed")


@tool
def search_db(query: str, limit: int = 5) -> str:
    """Search the customer database and return the matching records.

    Args:
        query: Search terms to match against customer records.
        limit: Maximum number of records to return.
    """
    raise NotImplementedError("search_db should be emulated, not executed")


def build_agent():
    """Create an agent whose tool calls are all answered by the emulator model."""
    # Pass an instance: LLMToolEmulator adds temperature=1 to a model string, and
    # the 5.5 models don't list temperature support. Thinking is disabled because
    # the emulator copies response.content, thinking blocks included, into the
    # ToolMessage.
    emulator_model = ChatAnthropic(
        model=EMULATOR_MODEL,
        max_tokens=1024,
        thinking={"type": "disabled"},
    )
    return create_agent(
        model=ChatAnthropic(model=AGENT_MODEL, max_tokens=8192),
        tools=[get_weather, search_db],
        system_prompt="Use the available tools to answer the user's question.",
        middleware=[LLMToolEmulator(model=emulator_model)],
    )


if __name__ == "__main__":
    result = build_agent().invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": "What's the weather in Paris, and which customers "
                    "in our database are based there?",
                }
            ]
        }
    )
    for message in result["messages"]:
        message.pretty_print()
