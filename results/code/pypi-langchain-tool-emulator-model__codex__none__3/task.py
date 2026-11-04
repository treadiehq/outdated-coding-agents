"""Integration-test agent with LLM-emulated tools.

Running this module requires ANTHROPIC_API_KEY. Agent and emulator calls use
the LLM API; weather services and databases are never contacted. Emulated
results are synthetic, so tests should not assert exact response text.
"""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool


@tool
def get_weather(location: str) -> str:
    """Get the current weather for a city or location."""
    raise AssertionError("get_weather must be intercepted by LLMToolEmulator")


@tool
def search_db(query: str) -> str:
    """Search the database using a natural-language query and return matching records."""
    raise AssertionError("search_db must be intercepted by LLMToolEmulator")


def build_agent(model: str = "anthropic:claude-sonnet-4-5-20250929"):
    """Create an agent whose two tools are answered by an LLM emulator."""
    tools = [get_weather, search_db]
    return create_agent(
        model=model,
        tools=tools,
        middleware=[LLMToolEmulator(tools=tools, model=model)],
        system_prompt=(
            "You are an assistant used in integration tests. Use get_weather for "
            "weather questions and search_db for database lookups. Use both tools "
            "when the request needs both, then summarize their results."
        ),
    )


if __name__ == "__main__":
    agent = build_agent()
    result = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": (
                        "What is the weather in Toronto? Also search the database "
                        "for customers based in Toronto."
                    ),
                }
            ]
        }
    )
    print(result["messages"][-1].content)
