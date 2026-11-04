"""LangChain agent for integration tests.

Tool calls are never executed; LangChain's built-in LLMToolEmulator
middleware has an LLM invent plausible tool results instead.
"""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain_core.tools import tool

AGENT_MODEL = "anthropic:claude-sonnet-5-5"
EMULATOR_MODEL = "anthropic:claude-haiku-5-5"


@tool
def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    raise RuntimeError("get_weather should be emulated, not executed")


@tool
def search_db(query: str) -> str:
    """Search the database for records matching a query."""
    raise RuntimeError("search_db should be emulated, not executed")


def build_agent():
    # tools=None would emulate every tool; listing them is explicit.
    emulator = LLMToolEmulator(
        tools=[get_weather, search_db],
        model=EMULATOR_MODEL,
    )
    return create_agent(
        model=AGENT_MODEL,
        tools=[get_weather, search_db],
        middleware=[emulator],
        system_prompt="You are a helpful assistant. Use tools when needed.",
    )


agent = build_agent()


if __name__ == "__main__":
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
    for message in result["messages"]:
        message.pretty_print()
