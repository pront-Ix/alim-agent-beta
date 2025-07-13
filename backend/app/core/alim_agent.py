import os
import json
from typing import List, TypedDict, Set
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
import ollama

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
embeddings = OllamaEmbeddings(model="llama4")

if not os.path.exists(FAISS_INDEX_PATH):
    raise ConnectionError(
        "FAISS index not found. Please run build_vector_store.py first."
    )

try:
    vector_store = FAISS.load_local(
        FAISS_INDEX_PATH, embeddings, allow_dangerous_deserialization=True
    )
    retriever = vector_store.as_retriever(
        search_kwargs={"k": 5}
    )  # Retrieve more context
    print("FAISS index loaded successfully.")
except Exception as e:
    raise RuntimeError(f"Could not load FAISS index: {e}")


def generate(question: str, context: List[Document], chat_history: List[BaseMessage]) -> str:
    print(f"Generating answer for question: {question}")

    context_str = ""
    arabic_texts = []
    unique_sources: Set[str] = set()

    if not context:
        # Handle cases where retriever returns nothing
        return "Je suis désolé, je n'ai trouvé aucune information pertinente dans mes sources pour répondre à votre question."

    for i, doc in enumerate(context):
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
            f"\n\n---\n*Texte Original (النص الأصلي):*\n{unique_arabic_texts}"
        )

    # --- FINAL, MOST ROBUST PROMPT ---
    system_instruction = f"""
    You are Alim, an expert Islamic knowledge assistant based on the book "Oussoûl as-Sounna" by Imâm Ahmad ibn Hanbal. Your answers must be clear, precise, and based ONLY on the provided context.

    **Your Mission:**
    1.  **Analyze the User's Question:** Understand the user's core need.
    
    2.  **Handle General vs. Specific Questions:**
        - **If the question is specific** (e.g., "What does the book say about the Quran?", "What is the view on the divine decree?"), synthesize an answer EXCLUSIVELY from the most relevant "Context Snippets".
        - **If the question is general** (e.g., "Teach me the sunnah", "Summarize the book", "Who are you?"), you MUST formulate an introductory answer. Base this introduction on the first principles mentioned in the context, especially those concerning 'adhering to the way of the companions', 'abandoning innovations', and 'following the texts'. This is your primary function when asked a general question.

    3.  **Synthesize Your Answer:** Combine the relevant information into a coherent response. **NEVER** invent information. If the specific answer isn't in the context, state that clearly.

    4.  **DO NOT mention "Context" or "Snippets" in your answer.** Respond directly and naturally.

    5.  **Append Citations:** After your answer, you MUST append the source citation block and the Arabic text block exactly as they are provided below. This is mandatory.

    **Conversation History:**
    {human_readable_chat_history(chat_history)}

    **Context Snippets (for your use only):**
    {context_str}

    **User's Question:** {question}
    
    ---
    **Your final output MUST follow this structure: [Your Answer][Source Citation Block][Original Arabic Text Block]**
    ---

    **Source Citation to Append:**
    {source_citation}

    **Original Arabic Text to Append:**
    {arabic_block}
    """

    response = ollama.chat(
        model="llama4",
        messages=[
            {
                'role': 'system',
                'content': system_instruction,
            },
            {
                'role': 'user',
                'content': question,
            }
        ]
    )

    return response['message']['content']


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


async def get_alim_response(user_message: str, session_id: str) -> str:
    chat_history = get_session_history(session_id)
    retrieved_docs = retriever.invoke(user_message)

    try:
        alim_answer = generate(user_message, retrieved_docs, chat_history)

        chat_history.append(HumanMessage(content=user_message))
        chat_history.append(AIMessage(content=alim_answer))
        save_session_history(session_id, chat_history)

        return alim_answer
    except Exception as e:
        print(f"Error during Alim agent invocation: {e}")
        chat_history.append(HumanMessage(content=user_message))
        save_session_history(session_id, chat_history)
        return "Je suis désolé, une erreur est survenue et je ne peux pas traiter votre demande pour le moment."