"""Integration-test agent with LLM-emulated tools.

Run with `.venv/bin/python task.py` and ANTHROPIC_API_KEY set.
Only the LLM is called; no weather service or database is accessed.
Emulated outputs vary, so tests should assert behavior rather than exact text.

Docs: https://docs.langchain.com/oss/python/langchain/middleware/built-in#llm-tool-emulator
"""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain_core.language_models.chat_models import BaseChatModel


def get_weather(location: str) -> str:
    """Get current weather for a city, including conditions and Celsius temperature."""
    raise RuntimeError("get_weather must be intercepted by LLMToolEmulator")


def search_db(query: str) -> str:
    """Search the places database using a natural-language query.

    Return matching places with their names, locations, and descriptions.
    """
    raise RuntimeError("search_db must be intercepted by LLMToolEmulator")


def create_test_agent(
    model: str | BaseChatModel = "anthropic:claude-sonnet-4-5-20250929",
    *,
    emulator_model: str | BaseChatModel | None = None,
):
    """Build an agent; optionally use a separate LLM to emulate tool results."""
    return create_agent(
        model=model,
        tools=[get_weather, search_db],
        middleware=[
            LLMToolEmulator(
                tools=["get_weather", "search_db"],
                # Explicit model avoids the middleware's deprecated default.
                model=model if emulator_model is None else emulator_model,
            )
        ],
        system_prompt=(
            "Use get_weather for weather questions and search_db for place searches. "
            "Base your answer on the tool results."
        ),
    )


if __name__ == "__main__":
    agent = create_test_agent()
    result = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": (
                        "Check the weather in Toronto and search the database for "
                        "places to visit there. Use both tools, then summarize."
                    ),
                }
            ]
        }
    )
    print(result["messages"][-1].content)
