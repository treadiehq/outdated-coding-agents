"""Integration-test agent with LLM-emulated tools.

Run with `.venv/bin/python task.py` and ANTHROPIC_API_KEY set. Tool outputs
are synthetic and may vary; the agent and emulator still make real LLM calls.
Built-in middleware: https://docs.langchain.com/oss/python/langchain/middleware/built-in#llm-tool-emulator
"""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool
from langchain_core.language_models import BaseChatModel


DEFAULT_MODEL = "anthropic:claude-sonnet-4-5-20250929"


@tool
def get_weather(location: str) -> str:
    """Get current weather for a city or location, including temperature in Celsius and conditions."""
    raise AssertionError("get_weather must be intercepted by LLMToolEmulator")


@tool
def search_db(query: str) -> str:
    """Search the internal knowledge database using a natural-language query and return matching records."""
    raise AssertionError("search_db must be intercepted by LLMToolEmulator")


def build_agent(
    model: str | BaseChatModel = DEFAULT_MODEL,
    *,
    emulator_model: str | BaseChatModel | None = None,
):
    """Build a fresh agent for a test, optionally injecting separate chat models."""
    return create_agent(
        model=model,
        tools=[get_weather, search_db],
        middleware=[
            LLMToolEmulator(
                tools=["get_weather", "search_db"],
                model=model if emulator_model is None else emulator_model,
            )
        ],
        system_prompt=(
            "Use get_weather for weather questions and search_db for internal "
            "database questions. Use both tools when the request needs both. "
            "You are running an integration test with synthetic tool results."
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
                        "Get the current weather in Toronto and search the internal "
                        "database for our Toronto office's bad-weather policy. "
                        "Summarize both results."
                    ),
                }
            ]
        },
        config={"recursion_limit": 10},
    )
    print(result["messages"][-1].content)
