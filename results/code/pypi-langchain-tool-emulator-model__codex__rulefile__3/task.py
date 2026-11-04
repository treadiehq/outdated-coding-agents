"""Integration-test agent with LLM-emulated tools.

Run with `.venv/bin/python task.py` and ANTHROPIC_API_KEY set. Tool outputs
are synthetic; both the agent and emulator still make real LLM requests.
"""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool
from langchain_core.language_models.chat_models import BaseChatModel


DEFAULT_MODEL = "anthropic:claude-sonnet-4-5-20250929"


@tool
def get_weather(location: str) -> str:
    """Get current weather for a city or location.

    Return the location, conditions, temperature in Celsius, and humidity.
    """
    raise AssertionError("get_weather must be intercepted by LLMToolEmulator")


@tool
def search_db(query: str) -> str:
    """Search the application database using a natural-language query.

    Return matching records with their IDs and relevant fields, or an empty
    list when no records match.
    """
    raise AssertionError("search_db must be intercepted by LLMToolEmulator")


def build_agent(
    model: str | BaseChatModel = DEFAULT_MODEL,
    emulator_model: str | BaseChatModel = DEFAULT_MODEL,
):
    """Build an agent for tests, optionally injecting either chat model.

    The built-in middleware answers tool calls without running tool bodies.
    Generated responses vary, so tests should assert behavior and structure
    rather than exact weather values or database records.
    """
    return create_agent(
        model=model,
        tools=[get_weather, search_db],
        middleware=[
            LLMToolEmulator(
                tools=[get_weather, search_db],
                model=emulator_model,
            )
        ],
        system_prompt="Use the available tools to answer the user's requests.",
    )


if __name__ == "__main__":
    agent = build_agent()
    result = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": (
                        "Get the current weather in Toronto and search the "
                        "database for outdoor events in Toronto. Use both tools."
                    ),
                }
            ]
        }
    )
    print(result["messages"][-1].content)
