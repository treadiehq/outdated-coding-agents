"""LangChain agent for integration tests with LLM-emulated tools.

`get_weather` and `search_db` are never really executed: LangChain's built-in
`LLMToolEmulator` middleware intercepts each tool call and has an LLM generate
the tool's result instead.

Requires ANTHROPIC_API_KEY in the environment.
"""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool

AGENT_MODEL = "anthropic:claude-sonnet-5-5"
EMULATOR_MODEL = "anthropic:claude-haiku-5-5"


@tool
def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    raise NotImplementedError("Emulated by LLMToolEmulator in tests.")


@tool
def search_db(query: str) -> str:
    """Search the database for records matching a query."""
    raise NotImplementedError("Emulated by LLMToolEmulator in tests.")


def build_agent():
    """Build an agent whose tool calls are answered by an LLM, not executed."""
    return create_agent(
        model=AGENT_MODEL,
        tools=[get_weather, search_db],
        system_prompt="You are a helpful assistant. Use the tools when needed.",
        middleware=[
            # Pass `model` explicitly: the implicit default is deprecated.
            # tools=None would emulate all tools; list them explicitly here.
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
                    "content": "What's the weather in Paris, and find orders for customer 42 in the database.",
                }
            ]
        }
    )
    for message in result["messages"]:
        message.pretty_print()
