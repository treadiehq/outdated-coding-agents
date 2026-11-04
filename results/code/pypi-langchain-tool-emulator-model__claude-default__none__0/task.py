"""LangChain agent for integration tests, with tool calls answered by an LLM."""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool
from langchain_anthropic import ChatAnthropic

AGENT_MODEL = "claude-opus-5-5"
EMULATOR_MODEL = "claude-haiku-5-5"


# The emulator only sees each tool's name, description and arguments, so the
# docstrings below determine what the emulated responses look like. The bodies
# raise so that a call reaching a real tool fails the test instead of passing.
@tool
def get_weather(location: str) -> str:
    """Get the current weather for a location.

    Returns the temperature in Celsius, conditions, humidity and wind speed.
    """
    raise NotImplementedError("get_weather should be emulated by LLMToolEmulator")


@tool
def search_db(query: str, limit: int = 5) -> str:
    """Search the customer database with a free-text query.

    Returns up to `limit` matching records as a JSON array of objects with `id`,
    `name`, `email` and `created_at` fields.
    """
    raise NotImplementedError("search_db should be emulated by LLMToolEmulator")


def build_agent():
    """Build the agent, with every tool call emulated rather than executed."""
    # Pass a model instance because a model string makes the middleware set
    # `temperature=1`. Thinking is disabled because the middleware copies all of
    # the response's content blocks into the ToolMessage, and thinking blocks are
    # not valid inside a tool result.
    emulator_model = ChatAnthropic(
        model=EMULATOR_MODEL,
        thinking={"type": "disabled"},
    )
    return create_agent(
        model=ChatAnthropic(model=AGENT_MODEL),
        tools=[get_weather, search_db],
        system_prompt="You are a helpful assistant. Use the tools to answer.",
        # With no `tools` argument, all tools are emulated, including any added later.
        middleware=[LLMToolEmulator(model=emulator_model)],
    )


if __name__ == "__main__":
    result = build_agent().invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": (
                        "What's the weather in Paris, and which customers "
                        "have an example.com email address?"
                    ),
                }
            ]
        }
    )
    for message in result["messages"]:
        message.pretty_print()
