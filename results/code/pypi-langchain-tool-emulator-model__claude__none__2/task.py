"""LangChain agent for integration tests with LLM-emulated tools.

The tools below are never actually executed: LangChain's built-in
`LLMToolEmulator` middleware intercepts each tool call and has an LLM
generate a plausible tool response from the tool's name, description and
arguments.
"""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool


@tool
def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    raise RuntimeError("get_weather should be emulated, not executed")


@tool
def search_db(query: str) -> str:
    """Search the database for records matching a query."""
    raise RuntimeError("search_db should be emulated, not executed")


AGENT_MODEL = "anthropic:claude-sonnet-5-5"
EMULATOR_MODEL = "anthropic:claude-haiku-5-5"


def build_agent():
    # With tools=None every tool would be emulated; listing them is explicit.
    emulator = LLMToolEmulator(
        tools=[get_weather, search_db],
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
                HumanMessage(
                    "What's the weather in Paris, and find orders for customer 42 in the database."
                )
            ]
        }
    )
    for message in result["messages"]:
        message.pretty_print()
