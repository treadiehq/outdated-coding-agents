"""Integration-test agent with LLM-emulated tools.

Real model calls require ANTHROPIC_API_KEY with the default model.
Tool outputs are synthetic and may vary between runs.

Middleware documentation:
https://docs.langchain.com/oss/python/langchain/middleware/built-in#llm-tool-emulator
"""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool
from langchain_core.language_models import BaseChatModel


DEFAULT_MODEL = "anthropic:claude-sonnet-4-5-20250929"


@tool
def get_weather(location: str) -> str:
    """Get current weather for a city or location, including temperature and conditions."""
    raise RuntimeError("get_weather must be intercepted by LLMToolEmulator")


@tool
def search_db(query: str) -> str:
    """Search the database with a natural-language query and return matching records."""
    raise RuntimeError("search_db must be intercepted by LLMToolEmulator")


def build_agent(
    model: str | BaseChatModel = DEFAULT_MODEL,
    *,
    emulator_model: str | BaseChatModel | None = None,
):
    """Build an agent; optionally inject separate agent and emulator test models."""
    return create_agent(
        model=model,
        tools=[get_weather, search_db],
        middleware=[
            # Pass a model explicitly: the installed version deprecates its default.
            # Omitting `tools` emulates every tool rather than executing its body.
            LLMToolEmulator(
                model=model if emulator_model is None else emulator_model,
            ),
        ],
        system_prompt=(
            "You are an integration-test assistant. Use get_weather for weather "
            "requests and search_db for database questions. Tool results are "
            "synthetic test data; summarize them without claiming they are real."
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
                        "Get the weather in Toronto and search the database for "
                        "outdoor activities in Toronto. Summarize both results."
                    ),
                }
            ]
        }
    )
    print(result["messages"][-1].content)
