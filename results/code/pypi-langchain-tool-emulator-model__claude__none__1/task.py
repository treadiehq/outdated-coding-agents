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
    raise RuntimeError("get_weather should be emulated, not executed")


@tool
def search_db(query: str) -> str:
    """Search the database and return matching records."""
    raise RuntimeError("search_db should be emulated, not executed")


def build_agent():
    """Build an agent whose tool calls are simulated by an LLM."""
    return create_agent(
        model=AGENT_MODEL,
        tools=[get_weather, search_db],
        system_prompt="You are a helpful assistant. Use the tools when needed.",
        middleware=[
            # Emulate both tools; tools=None would emulate every tool.
            LLMToolEmulator(tools=[get_weather, search_db], model=EMULATOR_MODEL),
        ],
    )


if __name__ == "__main__":
    agent = build_agent()
    result = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": "What's the weather in Paris, and find users named Alice in the db.",
                }
            ]
        }
    )
    for message in result["messages"]:
        message.pretty_print()
