"""LangChain agent for integration tests, with tool calls answered by an LLM."""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool
from langchain_anthropic import ChatAnthropic

AGENT_MODEL = "anthropic:claude-opus-5-5"
EMULATOR_MODEL = "claude-haiku-5-5"


# The emulator only reads each tool's name, description, and arguments. The bodies
# raise so that a test fails loudly if a call ever gets past the emulator.
@tool
def get_weather(location: str) -> str:
    """Get the current weather for a location."""
    raise NotImplementedError("get_weather should be emulated")


@tool
def search_db(query: str) -> str:
    """Search the database and return the matching records."""
    raise NotImplementedError("search_db should be emulated")


def build_agent():
    """Build an agent whose tool calls are all emulated."""
    # Pass the model explicitly: LLMToolEmulator's implicit default is deprecated.
    # Thinking is disabled because the emulator copies the response content into the
    # ToolMessage as is, and thinking blocks are not valid in a tool result.
    emulator_model = ChatAnthropic(
        model=EMULATOR_MODEL,
        thinking={"type": "disabled"},
    )
    return create_agent(
        model=AGENT_MODEL,
        tools=[get_weather, search_db],
        middleware=[LLMToolEmulator(model=emulator_model)],
    )


if __name__ == "__main__":
    agent = build_agent()
    result = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": "What's the weather in Paris, and do we have any "
                    "customers there in the database?",
                }
            ]
        }
    )
    for message in result["messages"]:
        message.pretty_print()
