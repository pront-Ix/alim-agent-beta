import os
import json
from typing import List, TypedDict, Set
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langgraph.graph import StateGraph, START
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage

from dotenv import load_dotenv

load_dotenv()

# --- Memory Management (No changes here) ---
MEMORY_DIR = "conversation_memories"
os.makedirs(MEMORY_DIR, exist_ok=True)


def get_session_history(session_id: str) -> List[BaseMessage]:
    file_path = os.path.join(MEMORY_DIR, f"{session_id}.json")
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            try:
                messages_data = json.load(f)
                return [
                    (
                        HumanMessage(content=msg["content"])
                        if msg["type"] == "human"
                        else AIMessage(content=msg["content"])
                    )
                    for msg in messages_data
                ]
            except json.JSONDecodeError:
                return []
    return []


def save_session_history(session_id: str, messages: List[BaseMessage]):
    file_path = os.path.join(MEMORY_DIR, f"{session_id}.json")
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(
            [{"type": msg.type, "content": msg.content} for msg in messages],
            f,
            ensure_ascii=False,
            indent=4,
        )


# --- LangChain setup - Vector Store Loading ---
FAISS_INDEX_PATH = "faiss_index"
embeddings = OpenAIEmbeddings(model="text-embedding-3-large")

if not os.path.exists(FAISS_INDEX_PATH):
    raise ConnectionError(
        "FAISS index not found. Please run build_vector_store.py first."
    )

try:
    vector_store = FAISS.load_local(
        FAISS_INDEX_PATH, embeddings, allow_dangerous_deserialization=True
    )
    retriever = vector_store.as_retriever(search_kwargs={"k": 5})
    print("FAISS index loaded successfully.")
except Exception as e:
    raise RuntimeError(f"Could not load FAISS index: {e}")


Ilm = ChatOpenAI(model="gpt-4o", temperature=0.1)


# --- State and Graph Definition ---
class State(TypedDict):
    question: str
    context: List[Document]
    answer: str
    chat_history: List[BaseMessage]


def retrieve(state: State):
    print(f"Retrieving for question: {state['question']}")
    retrieved_docs = retriever.invoke(state["question"])
    return {"context": retrieved_docs}


async def generate(state: State):
    print(f"Generating answer for question: {state['question']}")

    context_str = ""
    arabic_texts = []
    unique_sources: Set[str] = set()

    if not state["context"]:
        yield {"answer": "Je suis désolé, je n'ai trouvé aucune information pertinente dans mes sources pour répondre à votre question."}
        return

    for i, doc in enumerate(state["context"]):
        context_str += f"--- Context Snippet {i+1} ---\n{doc.page_content}\n\n"
        source_name = doc.metadata.get("source_name", "Unknown Source")
        source_ref = doc.metadata.get("source_reference", "")
        unique_sources.add(f"{source_name}, {source_ref}")
        if doc.metadata.get("content_arabic"):
            arabic_texts.append(doc.metadata["content_arabic"])

    source_citation = "\n\n---\n*Sources:*\n" + "\n".join(
        f"- {s}" for s in sorted(list(unique_sources))
    )

    arabic_block = ""
    if arabic_texts:
        unique_arabic_texts = "\n\n".join(sorted(list(set(arabic_texts))))
        arabic_block = (
            f"\n\n---\n*Original Text (النص الأصلي):*\n{unique_arabic_texts}"
        )

    system_instruction = f"""
    You are Alimni, an expert Islamic knowledge assistant based on the book "Oussoûl as-Sounna" by Imâm Ahmad ibn Hanbal. Your answers must be clear, precise, and based ONLY on the provided context.

    **Your Mission:**
    1.  **Detect Language:** You MUST detect the language of the "User's Question" (e.g., French, English, etc.).
    2.  **Respond in Same Language:** Your entire synthesized answer (the main text part) MUST be in the same language you detected. For example, if the user asks in French, you must answer in French.
    3.  **Handle General vs. Specific Questions:**
        - If the question is specific, synthesize an answer EXCLUSIVELY from the "Context Snippets".
        - If the question is general (e.g., "Summarize the book"), formulate an introductory answer based on the first principles mentioned in the context.
    4.  **Synthesize Your Answer:** Combine the relevant information into a coherent response. NEVER invent information. If the specific answer isn't in the context, state that clearly in the user's language.
    5.  **Append Citations:** After your answer, you MUST append the source citation block and the Arabic text block exactly as they are provided below. This is mandatory.

    **Conversation History:**
    {human_readable_chat_history(state['chat_history'])}

    **Context Snippets (for your use only):**
    {context_str}

    **User's Question:** {state['question']}
    
    ---
    **Your final output MUST follow this structure: [Your Answer in User's Language][Source Citation Block][Original Arabic Text Block]**
    ---

    **Source Citation to Append:**
    {source_citation}

    **Original Arabic Text to Append:**
    {arabic_block}
    """

    messages = [HumanMessage(content=system_instruction)]
    
    async for chunk in Ilm.astream(messages):
        content = chunk.content
        if content:
            yield {"answer": content}


def human_readable_chat_history(chat_history: List[BaseMessage]) -> str:
    if not chat_history:
        return "No history yet."
    return "\n".join(
        [
            (
                f"User: {m.content}"
                if isinstance(m, HumanMessage)
                else f"Alim: {m.content}"
            )
            for m in chat_history
        ]
    )


# --- Graph Assembly and Invocation (No changes here) ---
graph_builder = StateGraph(State)
graph_builder.add_node("retrieve", retrieve)
graph_builder.add_node("generate", generate)
graph_builder.add_edge(START, "retrieve")
graph_builder.add_edge("retrieve", "generate")
graph_builder.set_finish_point("generate")

app_graph = graph_builder.compile()


async def get_alim_response(user_message: str, session_id: str):
    chat_history = get_session_history(session_id)
    inputs = {"question": user_message, "chat_history": chat_history}

    full_alim_answer = ""
    try:
        async for event in app_graph.astream(inputs):
            if "generate" in event:
                chunk = event["generate"].get("answer")
                if chunk:
                    full_alim_answer += chunk
                    yield chunk

        # Now that the stream is complete, save the full history
        chat_history.append(HumanMessage(content=user_message))
        chat_history.append(AIMessage(content=full_alim_answer))
        save_session_history(session_id, chat_history)

    except Exception as e:
        print(f"Error during graph invocation: {e}")
        # Still save the user message to history
        chat_history.append(HumanMessage(content=user_message))
        save_session_history(session_id, chat_history)
        yield "Je suis désolé, une erreur est survenue et je ne peux pas traiter votre demande pour le moment."

