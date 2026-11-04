"""LangChain agent for integration tests, with tool calls answered by an LLM."""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool
from langchain_anthropic import ChatAnthropic

AGENT_MODEL = "anthropic:claude-opus-5-5"
EMULATOR_MODEL = "claude-haiku-5-5"


# The emulator shows the model each tool's docstring, so the docstrings describe
# the output. The bodies raise so that a real execution fails the test.
@tool
def get_weather(location: str) -> str:
    """Get the current weather for a location.

    Returns the temperature in Celsius and a short description of the conditions.
    """
    raise NotImplementedError("get_weather should be emulated, not executed")


@tool
def search_db(query: str, limit: int = 5) -> str:
    """Search the product database.

    Returns up to `limit` matching records as a JSON array of objects with `id`,
    `name`, and `price` fields.
    """
    raise NotImplementedError("search_db should be emulated, not executed")


def build_agent():
    """Create an agent whose tool calls are all answered by the emulator model."""
    # Pass an instance rather than a model string: LLMToolEmulator sets
    # temperature=1 on strings, and Haiku 5.5 docs say to omit temperature.
    # Thinking is disabled because the emulator copies the response content into
    # the ToolMessage as is, which would include any thinking blocks.
    emulator_model = ChatAnthropic(
        model=EMULATOR_MODEL,
        max_tokens=1024,
        thinking={"type": "disabled"},
    )
    return create_agent(
        model=AGENT_MODEL,
        tools=[get_weather, search_db],
        system_prompt="You are a helpful assistant. Use the tools to answer.",
        middleware=[LLMToolEmulator(model=emulator_model)],
    )


if __name__ == "__main__":
    agent = build_agent()
    result = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": "What's the weather in Paris, and which umbrellas "
                    "do we have in the database?",
                }
            ]
        }
    )
    for message in result["messages"]:
        print(f"[{message.type}] {message.text}")
