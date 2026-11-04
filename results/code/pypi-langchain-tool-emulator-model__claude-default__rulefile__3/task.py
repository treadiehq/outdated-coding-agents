"""LangChain agent for integration tests, with tool calls answered by an LLM.

Requires `ANTHROPIC_API_KEY` in the environment.
"""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool
from langchain_anthropic import ChatAnthropic

AGENT_MODEL = "anthropic:claude-opus-5-5"
EMULATOR_MODEL = "claude-sonnet-5"


@tool
def get_weather(location: str) -> str:
    """Get the current weather for a city or location."""
    raise NotImplementedError("get_weather should be emulated, not executed")


@tool
def search_db(query: str, limit: int = 10) -> str:
    """Search the database and return up to `limit` matching records as JSON."""
    raise NotImplementedError("search_db should be emulated, not executed")


def build_agent():
    """Create the agent, with every tool call emulated by an LLM."""
    # Pass an instance, not a model string: `LLMToolEmulator` would initialize a
    # string with `temperature=1`, which current Claude models don't declare support
    # for. Thinking is disabled because the emulator copies the response content into
    # the `ToolMessage` as is, and it must not contain thinking blocks. Newer models
    # such as Opus 5.5 and Sonnet 5.5 don't allow disabling it.
    emulator_model = ChatAnthropic(model=EMULATOR_MODEL, thinking={"type": "disabled"})

    return create_agent(
        model=AGENT_MODEL,
        tools=[get_weather, search_db],
        system_prompt="You are a helpful assistant. Use your tools to answer.",
        middleware=[LLMToolEmulator(model=emulator_model)],
    )


if __name__ == "__main__":
    result = build_agent().invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": "What's the weather in Paris? Also search the "
                    "database for customers based there.",
                }
            ]
        }
    )
    for message in result["messages"]:
        print(f"{message.type}: {message.text}")
