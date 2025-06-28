# backend/app/core/alim_agent.py
import os
import json
from typing import List, TypedDict
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
# from langchain_community.document_loaders import WebBaseLoader # Plus nécessaire si on charge de FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter # Encore utile si tu veux re-indexer manuellement
from langchain_community.vectorstores import FAISS
from langchain import hub
from langchain_core.documents import Document # Encore utile pour les types
from langgraph.graph import StateGraph, START
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_core.runnables import RunnablePassthrough
from operator import itemgetter

# Charger les variables d'environnement
from dotenv import load_dotenv
load_dotenv()

# Configuration des clés API
os.environ["USER_AGENT"]

# --- Gestion de la mémoire ---
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

# --- LangChain setup - Chargement du Vector Store ---
FAISS_INDEX_PATH = "faiss_index" # Doit correspondre au chemin de sauvegarde

embeddings = OpenAIEmbeddings(model="text-embedding-3-large")

vector_store = None # Initialiser à None
if os.path.exists(FAISS_INDEX_PATH):
    try:
        print(f"Chargement du vector store depuis : {FAISS_INDEX_PATH}")
        vector_store = FAISS.load_local(FAISS_INDEX_PATH, embeddings, allow_dangerous_deserialization=True)
        print("Vector store chargé avec succès.")
    except Exception as e:
        print(f"Erreur lors du chargement du vector store FAISS : {e}")
        print("Veuillez reconstruire le vector store en exécutant 'python build_vector_store.py'")
        # Fallback (optionnel): si échec de chargement, tu peux choisir de le reconstruire
        # ou laisser Alim sans base de connaissances externes.
        # Pour l'instant, on le laisse à None pour que retrieve() gère l'absence.
else:
    print(f"Le dossier '{FAISS_INDEX_PATH}' n'existe pas. Veuillez exécuter 'python build_vector_store.py' pour construire le vector store.")

Ilm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# Cell 5: Define state and prompt
class State(TypedDict):
    question: str
    context: List[Document]
    answer: str
    chat_history: List[BaseMessage]

prompt = hub.pull("rlm/rag-prompt")

# Cell 6: Define application steps
def retrieve(state: State):
    print(f"Retrieving for question: {state['question']}")
    if vector_store is None:
        print("Vector store non disponible, pas de récupération de contexte.")
        return {"context": []}
    retrieved_docs = vector_store.similarity_search(state["question"])
    print(f"Retrieved {len(retrieved_docs)} documents.")
    return {"context": retrieved_docs}

def generate(state: State):
    print(f"Generating answer for question: {state['question']}")
    docs_content = "\n\n".join(doc.page_content for doc in state["context"])

    # Instruction générale pour le LLM
    system_instruction = f"""
    Votre nom est Alim. Votre rôle est de fournir des réponses claires, précises et authentiques concernant la connaissance islamique.
    Vous êtes un assistant expert en Islam, et vous devez vous baser strictement sur les sources de connaissances que nous vous fournissons.

    **Contexte de la Mission :**
    Votre mission principale est de faciliter l'accès à la connaissance islamique. Vous êtes un pont entre l'utilisateur et les sources pures et authentiques (Hadiths, Qur'an, Sunnah du Prophète Muhammad - paix et bénédiction soient sur lui -, et la Sharî'a).

    **Vos Tâches Spécifiques :**
    1.  Répondre aux questions de l'utilisateur en vous basant EXCLUSIVEMENT sur les informations présentes dans le CONTEXTE fourni.
    2.  Maintenir la cohérence de la conversation en tenant compte de l'HISTORIQUE.

    **Ce que vous ne devez JAMAIS faire :**
    * **NE JAMAIS donner votre propre opinion ou raisonnement personnel.**
    * **NE JAMAIS inventer des informations** ou des réponses.
    * **NE JAMAIS chercher des informations en ligne de manière générale.** Vos sources sont pré-validées.
    * **NE JAMAIS spéculer** sur des sujets dont le contexte fourni ne traite pas explicitement.
    * **NE JAMAIS répondre à des questions qui ne sont pas liées à l'Islam.** Si la question est hors sujet islamique, ou si vous ne trouvez pas la réponse dans le contexte, dites poliment que vous ne pouvez pas répondre à cette question.

    **Ce que vous devez TOUJOURS faire :**
    * **Répondre en français ou langue de l'utlisateur.**
    * **Citer la source ou mentionner si l'information provient du Coran, Hadith, ou Sunnah si le contexte le permet.** (Cela dépend de la granularité du contexte que nous fournissons.)
    * **Dire "Je ne sais pas" ou "L'information n'est pas disponible dans mes sources actuelles"** si la réponse n'est pas clairement présente dans le CONTEXTE fourni.
    * **Adopter un ton respectueux, informatif et humble.**
    * **Privilégier la clarté et la concision.**

    **Méthodologie à suivre pour chaque situation :**
    1.  **Analyse de la Question :** Comprenez la question de l'utilisateur.
    2.  **Vérification du Contexte :** Recherchez la réponse directement et strictement dans le "CONTEXTE PERTINENT" fourni.
    3.  **Utilisation de l'Historique :** Tenez compte de l'HISTORIQUE DE LA CONVERSATION pour comprendre le fil de la discussion.
    4.  **Formulation de la Réponse :**
        * Si la réponse est dans le CONTEXTE, formulez une réponse basée uniquement sur ce contexte.
        * Si la question n'est PAS dans le CONTEXTE (ou si le contexte n'est pas suffisant), répondez : "Je ne suis pas en mesure de répondre à cette question basée sur les informations dont je dispose actuellement. Veuillez reformuler votre question ou consulter une autre source fiable."
        * Si la question est hors sujet islamique, répondez poliment que votre rôle est de répondre aux questions islamiques uniquement.

    --- Fin des instructions ---

    Voici l'historique de la conversation:
    {human_readable_chat_history(state['chat_history'])}

    Voici le contexte pertinent:
    {docs_content}

    Question de l'utilisateur: {state['question']}

    Votre réponse basée sur les instructions ci-dessus :
    """

    messages = [HumanMessage(content=system_instruction)] # Nous injectons toutes les instructions ici.

    response = Ilm.invoke(messages)
    print(f"Generated answer: {response.content[:50]}...")
    return {"answer": response.content}


def human_readable_chat_history(chat_history: List[BaseMessage]) -> str:
    formatted_history = []
    for msg in chat_history:
        if isinstance(msg, HumanMessage):
            formatted_history.append(f"Utilisateur: {msg.content}")
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
        raise ValueError("session_id doit être fourni pour gérer l'historique.")

    chat_history = get_session_history(session_id)
    # print(f"Loaded history for session {session_id}: {chat_history}") # Décommenter pour debug

    inputs = {
        "question": user_message,
        "context": [],
        "answer": "",
        "chat_history": chat_history
    }

    try:
        result = app_graph.invoke(inputs)
        alim_answer = result.get("answer", "Désolé, je n'ai pas pu générer de réponse.")

        chat_history.append(HumanMessage(content=user_message))
        chat_history.append(AIMessage(content=alim_answer))
        save_session_history(session_id, chat_history)
        # print(f"Saved history for session {session_id}.") # Décommenter pour debug

        return alim_answer
    except Exception as e:
        print(f"Erreur lors de l'invocation de l'agent Alim : {e}")
        chat_history.append(HumanMessage(content=user_message))
        # We don't include Alim's response if it failed.
        save_session_history(session_id, chat_history)
        raise e