"""Agent for integration tests: tool calls are answered by an LLM, not executed."""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool
from langchain_anthropic import ChatAnthropic


@tool
def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    raise RuntimeError("Real tool should never run under emulation")


@tool
def search_db(query: str) -> str:
    """Search the database for records matching a query."""
    raise RuntimeError("Real tool should never run under emulation")


def build_agent():
    # The model is passed explicitly: LLMToolEmulator's implicit default is deprecated.
    emulator = LLMToolEmulator(
        tools=[get_weather, search_db],
        model=ChatAnthropic(model="claude-haiku-5-5", temperature=1),
    )
    return create_agent(
        model=ChatAnthropic(model="claude-sonnet-5-5"),
        tools=[get_weather, search_db],
        middleware=[emulator],
    )


if __name__ == "__main__":
    agent = build_agent()
    result = agent.invoke(
        {"messages": [{"role": "user", "content": "What's the weather in Paris, and find orders for customer 42."}]}
    )
    for message in result["messages"]:
        message.pretty_print()
