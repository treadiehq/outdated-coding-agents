"""LangChain agent for integration tests with LLM-emulated tools.

The tools below are never actually executed: LangChain's built-in
`LLMToolEmulator` middleware intercepts each tool call and asks an LLM to
generate a plausible tool result from the tool's name, description and the
call arguments.
"""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain_core.tools import tool

AGENT_MODEL = "anthropic:claude-sonnet-5-5"
EMULATOR_MODEL = "anthropic:claude-haiku-5-5"


@tool
def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    raise RuntimeError("Real tool should never run in integration tests.")


@tool
def search_db(query: str) -> str:
    """Search the database for records matching a query."""
    raise RuntimeError("Real tool should never run in integration tests.")


def build_agent():
    # Emulate every tool listed (pass tools=None to emulate all agent tools).
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
    for message in result["messages"]:
        message.pretty_print()
