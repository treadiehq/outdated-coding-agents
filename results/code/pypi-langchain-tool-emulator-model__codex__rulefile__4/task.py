"""Integration-test agent with LLM-emulated tools.

Running this file requires ANTHROPIC_API_KEY. Tool services are never contacted,
but both the agent and emulator make real model calls. Emulated results vary;
assert on behavior rather than exact response text in integration tests.
"""

import os

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool
from langchain_core.language_models.chat_models import BaseChatModel


DEFAULT_MODEL = "anthropic:claude-sonnet-4-5-20250929"


@tool
def get_weather(location: str) -> str:
    """Get current weather for a city or location, including temperature and conditions."""
    raise RuntimeError("get_weather must be intercepted by LLMToolEmulator")


@tool
def search_db(query: str) -> str:
    """Search database records using a natural-language query and return matching records."""
    raise RuntimeError("search_db must be intercepted by LLMToolEmulator")


def build_agent(
    model: str | BaseChatModel = DEFAULT_MODEL,
    *,
    emulator_model: str | BaseChatModel | None = None,
):
    """Build an agent; optionally inject separate agent and emulator models for tests."""
    return create_agent(
        model=model,
        tools=[get_weather, search_db],
        middleware=[
            LLMToolEmulator(
                tools=[get_weather, search_db],
                model=model if emulator_model is None else emulator_model,
            )
        ],
        system_prompt=(
            "You are an integration-test assistant. Use get_weather for weather "
            "questions and search_db for database questions. Use both tools when "
            "both are requested. Tool results are simulated test data."
        ),
    )


if __name__ == "__main__":
    agent = build_agent(os.environ.get("AGENT_MODEL", DEFAULT_MODEL))
    result = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": (
                        "Get the weather in Toronto and search the database for "
                        "outdoor events in Toronto. Summarize both results."
                    ),
                }
            ]
        }
    )
    print(result["messages"][-1].content)
