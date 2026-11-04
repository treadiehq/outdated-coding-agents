"""LangChain agent for integration tests.

Tool calls are answered by an LLM (via LangChain's built-in LLMToolEmulator
middleware) instead of executing the real tool bodies.
"""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain_core.tools import tool

AGENT_MODEL = "anthropic:claude-sonnet-5-5"
EMULATOR_MODEL = "anthropic:claude-haiku-5-5"


@tool
def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    raise RuntimeError("Real tool should never run in integration tests")


@tool
def search_db(query: str) -> str:
    """Search the database and return matching records."""
    raise RuntimeError("Real tool should never run in integration tests")


def build_agent():
    # With no `tools` argument, the emulator intercepts every tool call.
    # Pass tools=["get_weather", "search_db"] to limit it explicitly.
    emulator = LLMToolEmulator(
        tools=["get_weather", "search_db"],
        model=EMULATOR_MODEL,
    )
    return create_agent(
        model=AGENT_MODEL,
        tools=[get_weather, search_db],
        middleware=[emulator],
    )


if __name__ == "__main__":
    agent = build_agent()
    result = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": "What's the weather in Paris, and find orders for customer 42 in the DB.",
                }
            ]
        }
    )
    print(result["messages"][-1].content)
