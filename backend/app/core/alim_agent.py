import os
import json
from typing import List, TypedDict
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
# from langchain_community.document_loaders import WebBaseLoader # No longer needed if loading from FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter # Still useful if you want to re-index manually
from langchain_community.vectorstores import FAISS
from langchain import hub
from langchain_core.documents import Document 
from langgraph.graph import StateGraph, START
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_core.runnables import RunnablePassthrough
from operator import itemgetter

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Configure API keys
os.environ["USER_AGENT"]

# --- Memory Management ---
MEMORY_DIR = "conversation_memories"
os.makedirs(MEMORY_DIR, exist_ok=True)

def get_session_history(session_id: str) -> List[BaseMessage]:
    file_path = os.path.join(MEMORY_DIR, f"{session_id}.json")
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            messages_data = json.load(f)
            messages = []
            for msg_data in messages_data:
                if msg_data['type'] == 'human':
                    messages.append(HumanMessage(content=msg_data['content']))
                elif msg_data['type'] == 'ai':
                    messages.append(AIMessage(content=msg_data['content']))
            return messages
    return []

def save_session_history(session_id: str, messages: List[BaseMessage]):
    file_path = os.path.join(MEMORY_DIR, f"{session_id}.json")
    messages_data = []
    for msg in messages:
        messages_data.append({"type": msg.type, "content": msg.content})
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(messages_data, f, ensure_ascii=False, indent=4)

# --- LangChain setup - Vector Store Loading ---
FAISS_INDEX_PATH = "faiss_index" # Must match the save path

embeddings = OpenAIEmbeddings(model="text-embedding-3-large")

vector_store = None # Initialize to None
if os.path.exists(FAISS_INDEX_PATH):
    try:
        print(f"Loading vector store from: {FAISS_INDEX_PATH}")
        vector_store = FAISS.load_local(FAISS_INDEX_PATH, embeddings, allow_dangerous_deserialization=True)
        print("Vector store loaded successfully.")
    except Exception as e:
        print(f"Error loading FAISS vector store: {e}")
        print("Please rebuild the vector store by running 'python build_vector_store.py'")
        # Fallback (optional): if loading fails, you can choose to rebuild it
        # or let Alim run without an external knowledge base.
        # For now, we leave it as None so that retrieve() handles its absence.
else:
    print(f"The '{FAISS_INDEX_PATH}' directory does not exist. Please run 'python build_vector_store.py' to build the vector store.")

Ilm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# Cell 5: Define state and prompt
class State(TypedDict):
    question: str
    context: List[Document]
    answer: str
    chat_history: List[BaseMessage]

prompt = hub.pull("rlm/rag-prompt")

def retrieve(state: State):
    print(f"Retrieving for question: {state['question']}")
    if vector_store is None:
        print("Vector store not available, no context retrieval.")
        return {"context": []}
    retrieved_docs = vector_store.similarity_search(state["question"])
    print(f"Retrieved {len(retrieved_docs)} documents.")
    return {"context": retrieved_docs}

def generate(state: State):
    print(f"Generating answer for question: {state['question']}")
    docs_content = "\n\n".join(doc.page_content for doc in state["context"])

    # General instruction for the LLM
    system_instruction = f"""
    Your name is Alim. You are a friendly, helpful, and good Muslim servant. Your role is to provide clear, precise, and authentic answers regarding Islamic knowledge.
    You are an expert assistant in Islam, and you must strictly rely on the knowledge sources we provide.

    **Mission Context:**
    Your primary mission is to facilitate access to Islamic knowledge. You are a bridge between the user and pure and authentic sources (Hadiths, Qur'an, Sunnah of Prophet Muhammad - peace and blessings be upon him -, and Sharia).

    **Your Specific Tasks:**
    1.  Answer user questions based EXCLUSIVELY on the information present in the provided CONTEXT.
    2.  Maintain conversation coherence by considering the HISTORY.

    **What you should NEVER do:**
    * **NEVER give your own opinion or personal reasoning.**
    * **NEVER invent information** or answers.
    * **NEVER search for information online in a general way.** Your sources are pre-validated.
    * **NEVER speculate** on topics that the provided context does not explicitly address.
    * **NEVER answer questions unrelated to Islam.** If the question is off-topic Islamic, or if you cannot find the answer in the context, politely state that you cannot answer this question.

    **What you should ALWAYS do:**
    * **Respond in the language of the user's input.**
    * **Cite the source or mention if the information comes from the Quran, Hadith, or Sunnah if the context allows.** (This depends on the granularity of the context we provide.)
    * **Say "I don't know" or "The information is not available in my current sources"** if the answer is not clearly present in the provided CONTEXT.
    * **Adopt a respectful, informative, and humble tone.**
    * **Prioritize clarity and conciseness.**

    **Methodology to follow for each situation:**
    1.  **Question Analysis:** Understand the user's question.
    2.  **Context Verification:** Search for the answer directly and strictly within the provided "RELEVANT CONTEXT."
    3.  **History Usage:** Take into account the CONVERSATION HISTORY to understand the flow of the discussion.
    4.  **Response Formulation:**
        * If the answer is in the CONTEXT, formulate a response based solely on that context.
        * If the question is NOT in the CONTEXT (or if the context is insufficient), respond: "I am unable to answer this question based on the information I currently have. Please rephrase your question or consult another reliable source."
        * If the question is off-topic Islamic, politely state that your role is to answer Islamic questions only.

    --- End of instructions ---

    Here is the conversation history:
    {human_readable_chat_history(state['chat_history'])}

    Here is the relevant context:
    {docs_content}

    User's question: {state['question']}

    Your answer based on the instructions above :
    """

    messages = [HumanMessage(content=system_instruction)] # We inject all instructions here.

    response = Ilm.invoke(messages)
    print(f"Generated answer: {response.content[:50]}...")
    return {"answer": response.content}


def human_readable_chat_history(chat_history: List[BaseMessage]) -> str:
    formatted_history = []
    for msg in chat_history:
        if isinstance(msg, HumanMessage):
            formatted_history.append(f"User: {msg.content}")
        elif isinstance(msg, AIMessage):
            formatted_history.append(f"Alim: {msg.content}")
    return "\n".join(formatted_history)

# Build and compile the graph
graph_builder = StateGraph(State)
graph_builder.add_node("retrieve", retrieve)
graph_builder.add_node("generate", generate)
graph_builder.add_edge(START, "retrieve")
graph_builder.add_edge("retrieve", "generate")
graph_builder.set_finish_point("generate")

app_graph = graph_builder.compile()

async def get_alim_response(user_message: str, session_id: str) -> str:
    if not session_id:
        raise ValueError("session_id must be provided to manage history.")

    chat_history = get_session_history(session_id)
    # print(f"Loaded history for session {session_id}: {chat_history}") # Uncomment for debugging

    inputs = {
        "question": user_message,
        "context": [],
        "answer": "",
        "chat_history": chat_history
    }

    try:
        result = app_graph.invoke(inputs)
        alim_answer = result.get("answer", "Sorry, I could not generate a response.")

        chat_history.append(HumanMessage(content=user_message))
        chat_history.append(AIMessage(content=alim_answer))
        save_session_history(session_id, chat_history)
        # print(f"Saved history for session {session_id}.") # Uncomment for debugging

        return alim_answer
    except Exception as e:
        print(f"Error during Alim agent invocation: {e}")
        chat_history.append(HumanMessage(content=user_message))
        # We don't include Alim's response if it failed.
        save_session_history(session_id, chat_history)
        raise e