"""LangChain agent for integration tests, with tool calls answered by an LLM.

`LLMToolEmulator` intercepts every tool call, so the agent loop runs end to end
without any tool body executing. Requires `ANTHROPIC_API_KEY`.
"""

from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolEmulator
from langchain.tools import tool
from langchain_anthropic import ChatAnthropic

AGENT_MODEL = "claude-opus-5-5"
EMULATOR_MODEL = "claude-haiku-5-5"


# The emulator builds its prompt from each tool's name, description, and call
# arguments, so the docstrings below shape the emulated responses.
@tool
def get_weather(location: str) -> str:
    """Get the current weather for a location, including temperature and conditions.

    Args:
        location: City and region or country, such as "Paris, France".
    """
    raise NotImplementedError("get_weather should be emulated by LLMToolEmulator")


@tool
def search_db(query: str, limit: int = 5) -> str:
    """Search the customer database and return matching records as a JSON array.

    Args:
        query: Search terms to match against customer records.
        limit: Maximum number of records to return.
    """
    raise NotImplementedError("search_db should be emulated by LLMToolEmulator")


def build_agent():
    """Create the agent under test, with all of its tool calls emulated."""
    # Pass a model instance: given a string, LLMToolEmulator adds `temperature=1`,
    # which Haiku 5.5 says to omit. Thinking is disabled because the emulator
    # copies the response content into the tool result as is, and thinking blocks
    # don't belong there.
    emulator_model = ChatAnthropic(
        model=EMULATOR_MODEL,
        thinking={"type": "disabled"},
    )

    return create_agent(
        model=ChatAnthropic(model=AGENT_MODEL),
        tools=[get_weather, search_db],
        system_prompt="You are a helpful assistant. Use your tools to answer.",
        middleware=[LLMToolEmulator(model=emulator_model)],
    )


if __name__ == "__main__":
    agent = build_agent()
    result = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": (
                        "What's the weather in Paris, and which customers "
                        "in our database are based there?"
                    ),
                }
            ]
        }
    )
    print(result["messages"][-1].text)
