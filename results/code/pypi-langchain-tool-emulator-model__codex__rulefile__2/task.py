"""Integration-test agent with LLM-emulated tools.

Run with ANTHROPIC_API_KEY set. Tool responses are simulated, but agent and
emulator model calls still use the model provider and incur normal API costs.

Middleware reference:
https://docs.langchain.com/oss/python/langchain/middleware/built-in
"""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool
from langchain_core.language_models import BaseChatModel


@tool
def get_weather(location: str) -> str:
    """Get current weather, including temperature and conditions, for a location."""
    raise AssertionError("get_weather must be intercepted by LLMToolEmulator")


@tool
def search_db(query: str) -> str:
    """Search the database for records matching a natural-language query."""
    raise AssertionError("search_db must be intercepted by LLMToolEmulator")


def build_agent(
    model: str | BaseChatModel = "anthropic:claude-sonnet-4-5-20250929",
    *,
    emulator_model: str | BaseChatModel | None = None,
):
    """Build an agent; optionally supply separate models for test orchestration."""
    return create_agent(
        model=model,
        tools=[get_weather, search_db],
        # Omitting tools makes the built-in middleware emulate every tool.
        middleware=[
            LLMToolEmulator(
                model=emulator_model if emulator_model is not None else model,
            )
        ],
        system_prompt=(
            "You are an integration-test assistant. Use get_weather for weather "
            "questions and search_db for database questions. Use both tools when "
            "both are needed, and base your answer on their results."
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
                        "What is the weather in Toronto, and what outdoor venues "
                        "does our database list there?"
                    ),
                }
            ]
        }
    )
    print(result["messages"][-1].content)
