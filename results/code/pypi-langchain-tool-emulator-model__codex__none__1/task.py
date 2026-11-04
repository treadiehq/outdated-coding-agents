"""Integration-test agent with LLM-emulated tools.

Requires ANTHROPIC_API_KEY when invoked. Agent and emulator calls use the
model API; weather services and databases are never contacted.
"""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool


@tool
def get_weather(location: str) -> str:
    """Get current weather for a city, including temperature and conditions."""
    raise AssertionError("get_weather must be intercepted by LLMToolEmulator")


@tool
def search_db(query: str) -> str:
    """Search database records by natural-language query and return matching records."""
    raise AssertionError("search_db must be intercepted by LLMToolEmulator")


MODEL = "anthropic:claude-sonnet-4-5-20250929"

agent = create_agent(
    model=MODEL,
    tools=[get_weather, search_db],
    middleware=[LLMToolEmulator(model=MODEL)],
    system_prompt=(
        "You are an integration-test assistant. Use get_weather for weather "
        "questions and search_db for database queries. Summarize the tool results."
    ),
)


if __name__ == "__main__":
    result = agent.invoke(
        {"messages": [{"role": "user", "content": (
            "Get the weather in Toronto and search the database for outdoor "
            "events in Toronto."
        )}]}
    )
    print(result["messages"][-1].content)
