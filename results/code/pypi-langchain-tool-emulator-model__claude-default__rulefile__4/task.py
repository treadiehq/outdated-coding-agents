"""LangChain agent for integration tests, with every tool call answered by an LLM."""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool
from langchain_anthropic import ChatAnthropic

AGENT_MODEL = "anthropic:claude-opus-5-5"
EMULATOR_MODEL = "claude-haiku-5-5"


@tool
def get_weather(location: str) -> str:
    """Return the current weather for a city, including temperature and conditions."""
    raise NotImplementedError("get_weather should be emulated, not executed")


@tool
def search_db(query: str) -> str:
    """Search the database and return the records that match the query."""
    raise NotImplementedError("search_db should be emulated, not executed")


def build_agent():
    # Pass a model instance: LLMToolEmulator adds temperature=1 to a model string,
    # and Haiku 5.5 expects sampling parameters to be omitted. Thinking is disabled
    # because the emulator copies the response content into the ToolMessage as is,
    # which would include any thinking blocks.
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
    result = build_agent().invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": "What's the weather in Paris, and which orders in "
                    "the database are from customers there?",
                }
            ]
        }
    )
    for message in result["messages"]:
        message.pretty_print()
