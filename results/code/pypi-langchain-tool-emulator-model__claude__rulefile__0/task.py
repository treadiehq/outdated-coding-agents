"""Agent for integration tests: tool calls are answered by an LLM, not executed."""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool


@tool
def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    raise RuntimeError("Real get_weather must not run in integration tests")


@tool
def search_db(query: str) -> str:
    """Search the database for records matching a query."""
    raise RuntimeError("Real search_db must not run in integration tests")


# The emulator model is passed explicitly; relying on its default is deprecated.
tool_emulator = LLMToolEmulator(
    tools=[get_weather, search_db],
    model="anthropic:claude-haiku-5-5",
)

agent = create_agent(
    model="anthropic:claude-sonnet-5-5",
    tools=[get_weather, search_db],
    middleware=[tool_emulator],
)


if __name__ == "__main__":
    result = agent.invoke(
        {"messages": [{"role": "user", "content": "What's the weather in Paris?"}]}
    )
    print(result["messages"][-1].content)
