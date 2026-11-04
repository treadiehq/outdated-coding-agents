"""Integration-test agent with LLM-emulated tools.

Run with ``.venv/bin/python task.py`` and ANTHROPIC_API_KEY set.
Only the LLM is called; no weather service or database is accessed.
Emulated outputs vary, so tests should assert behavior rather than exact text.

API checked against installed langchain 1.4.6 and the middleware docs:
https://docs.langchain.com/oss/python/langchain/middleware/built-in#llm-tool-emulator
"""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool
from langchain_core.language_models import BaseChatModel


@tool
def get_weather(location: str) -> str:
    """Get current weather for a city or location, including Celsius temperature and conditions."""
    raise RuntimeError("get_weather must be intercepted by LLMToolEmulator")


@tool
def search_db(query: str) -> str:
    """Search the database with a natural-language query and return matching records with IDs and summaries."""
    raise RuntimeError("search_db must be intercepted by LLMToolEmulator")


def build_agent(
    model: str | BaseChatModel = "anthropic:claude-sonnet-4-5-20250929",
    *,
    emulator_model: str | BaseChatModel | None = None,
):
    """Build an agent; optionally supply a separate model for tool emulation."""
    tools = [get_weather, search_db]
    return create_agent(
        model=model,
        tools=tools,
        middleware=[
            LLMToolEmulator(
                tools=tools,
                # The installed version deprecates its implicit model default.
                model=model if emulator_model is None else emulator_model,
            )
        ],
        system_prompt=(
            "You are an integration-test assistant. Use get_weather for weather "
            "questions and search_db for database queries. Tool results are "
            "simulated test data; describe them as such in your answer."
        ),
    )


if __name__ == "__main__":
    agent = build_agent()
    result = agent.invoke(
        {"messages": [{"role": "user", "content": (
            "Get the weather in Toronto and search the database for outdoor "
            "activities in Toronto. Use both tools and summarize the test results."
        )}]},
        config={"recursion_limit": 20},
    )
    print(result["messages"][-1].content)
