"""Integration-test agent with LLM-emulated tools.

Running this file requires ANTHROPIC_API_KEY. Tool results are synthetic;
the agent and emulator still make real LLM calls.

API checked against installed langchain 1.4.6 and the middleware docs:
https://docs.langchain.com/oss/python/langchain/middleware/built-in#llm-tool-emulator
"""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool
from langchain_core.language_models.chat_models import BaseChatModel


@tool
def get_weather(location: str) -> str:
    """Get current weather for a city or location, including temperature and conditions."""
    raise RuntimeError("get_weather must be intercepted by LLMToolEmulator")


@tool
def search_db(query: str) -> str:
    """Search the database using a natural-language query and return matching records."""
    raise RuntimeError("search_db must be intercepted by LLMToolEmulator")


def build_agent(
    model: str | BaseChatModel = "anthropic:claude-sonnet-4-6",
    emulator_model: str | BaseChatModel | None = None,
):
    """Build an agent for integration tests without weather or database access.

    Pass model instances to customize test configuration. Emulated responses
    vary, so tests should assert workflow behavior rather than exact wording.
    """
    return create_agent(
        model=model,
        tools=[get_weather, search_db],
        middleware=[
            # Explicit model avoids the deprecated implicit default in 1.4.6.
            # Omitting tools emulates every tool registered with the agent.
            LLMToolEmulator(
                model=emulator_model if emulator_model is not None else model,
            ),
        ],
        system_prompt=(
            "You are an integration-test assistant. Use get_weather for weather "
            "questions and search_db for database queries. Tool outputs are "
            "synthetic test data; summarize them as simulated results."
        ),
    )


if __name__ == "__main__":
    agent = build_agent()
    result = agent.invoke(
        {"messages": [{"role": "user", "content": (
            "Get the weather in Toronto and search the database for outdoor "
            "activities in Toronto. Summarize both results."
        )}]},
        config={"recursion_limit": 20},
    )
    print(result["messages"][-1].content)
