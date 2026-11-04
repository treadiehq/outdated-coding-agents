"""LangChain agent for integration tests, with tool calls answered by an LLM.

Requires `ANTHROPIC_API_KEY`. The agent model and the emulator both make real
API calls; only the tools themselves are replaced.
"""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool
from langchain_anthropic import ChatAnthropic

AGENT_MODEL = "claude-opus-5-5"
EMULATOR_MODEL = "claude-haiku-5-5"


@tool
def get_weather(location: str) -> str:
    """Get the current weather for a city, including temperature and conditions.

    Args:
        location: City name, for example "Paris".
    """
    raise NotImplementedError("get_weather should be answered by LLMToolEmulator")


@tool
def search_db(query: str, limit: int = 5) -> str:
    """Search the customer database and return matching records as JSON.

    Args:
        query: Search terms to match against customer records.
        limit: Maximum number of records to return.
    """
    raise NotImplementedError("search_db should be answered by LLMToolEmulator")


def build_agent():
    """Create an agent whose tool calls are all emulated by an LLM."""
    # Pass a model instance, not a string: LLMToolEmulator's implicit default
    # model is deprecated, and it initializes string models with temperature=1,
    # which Claude Haiku 5.5 says to omit.
    #
    # Thinking must stay off because the emulator copies the response's content
    # into the ToolMessage as is, and a thinking block would end up inside the
    # tool_result. Opus 5.5 and Fable reject "disabled", and Sonnet 5.5 needs
    # "between_tools", so changing EMULATOR_MODEL means revisiting this setting.
    emulator_model = ChatAnthropic(
        model=EMULATOR_MODEL,
        thinking={"type": "disabled"},
    )

    return create_agent(
        model=ChatAnthropic(model=AGENT_MODEL),
        tools=[get_weather, search_db],
        middleware=[LLMToolEmulator(model=emulator_model)],
    )


if __name__ == "__main__":
    result = build_agent().invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": (
                        "What's the weather in Paris, and which customers in our "
                        "database are based there?"
                    ),
                }
            ]
        }
    )
    for message in result["messages"]:
        message.pretty_print()
