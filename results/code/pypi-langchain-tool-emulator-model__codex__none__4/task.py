"""Integration-test agent with LLM-emulated tools.

Set ANTHROPIC_API_KEY before running this file. Agent and emulator calls use
the real LLM API; weather services and databases are never contacted.
"""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool


@tool
def get_weather(location: str) -> str:
    """Get the current weather, temperature, and conditions for a location."""
    raise AssertionError("get_weather must be intercepted by LLMToolEmulator")


@tool
def search_db(query: str) -> str:
    """Search the database for records relevant to a natural-language query."""
    raise AssertionError("search_db must be intercepted by LLMToolEmulator")


MODEL = "anthropic:claude-sonnet-4-5-20250929"

agent = create_agent(
    model=MODEL,
    tools=[get_weather, search_db],
    middleware=[
        LLMToolEmulator(tools=[get_weather, search_db], model=MODEL),
    ],
    system_prompt=(
        "You are an assistant in an integration-test environment. "
        "Use get_weather for weather questions and search_db to find records. "
        "Tool results are simulated test data."
    ),
)


if __name__ == "__main__":
    result = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": (
                        "Get the current weather in Toronto and search the "
                        "database for outdoor activities in Toronto."
                    ),
                }
            ]
        }
    )
    print(result["messages"][-1].content)
