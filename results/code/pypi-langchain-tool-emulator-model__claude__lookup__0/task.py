"""LangChain agent for integration tests.

The tools below are never really executed: `LLMToolEmulator` intercepts each
tool call and has an LLM generate the tool's output instead.
"""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.chat_models import init_chat_model
from langchain.tools import tool

AGENT_MODEL = "anthropic:claude-sonnet-5-5"
EMULATOR_MODEL = "anthropic:claude-haiku-5-5"


@tool
def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    raise RuntimeError("get_weather must be emulated in tests, not executed")


@tool
def search_db(query: str) -> str:
    """Search the database for records matching a query."""
    raise RuntimeError("search_db must be emulated in tests, not executed")


def build_agent():
    tools = [get_weather, search_db]
    emulator = LLMToolEmulator(
        tools=tools,  # emulate both tools (omit to emulate all)
        model=init_chat_model(EMULATOR_MODEL, temperature=1),
    )
    return create_agent(
        model=AGENT_MODEL,
        tools=tools,
        system_prompt="You are a helpful assistant. Use the tools when needed.",
        middleware=[emulator],
    )


if __name__ == "__main__":
    agent = build_agent()
    result = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": "What's the weather in Paris, and find orders for customer 42.",
                }
            ]
        }
    )
    for message in result["messages"]:
        message.pretty_print()
