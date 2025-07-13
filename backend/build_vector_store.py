import os
import json
from langchain_core.documents import Document  # <-- NEW, important import
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from dotenv import load_dotenv

load_dotenv()

# --- Configuration (remains the same) ---
KNOWLEDGE_BASE_DIR = "app/core/knowledge_base"
FAISS_INDEX_PATH = "faiss_index"


def build_and_save_vector_store():
    """
    Loads documents MANUALLY from the JSONL knowledge base,
    creates LangChain Document objects with complete metadata,
    and builds a FAISS vector store.
    """
    if not os.path.exists(KNOWLEDGE_BASE_DIR):
        print(
            f"Error: The knowledge base directory '{KNOWLEDGE_BASE_DIR}' does not exist."
        )
        return

    print(f"Loading documents manually from: {KNOWLEDGE_BASE_DIR}")
    documents = []

    for filename in os.listdir(KNOWLEDGE_BASE_DIR):
        file_path = os.path.join(KNOWLEDGE_BASE_DIR, filename)

        if filename.endswith(".jsonl"):
            print(f"Processing file: {filename}")
            with open(file_path, "r", encoding="utf-8") as f:
                for line in f:
                    try:
                        # Load each line as a JSON object
                        data = json.loads(line)

                        # --- MANUAL and EXPLICIT Document creation ---
                        # We create a Document object ourselves to ensure all metadata is included.

                        doc = Document(
                            page_content=data.get(
                                "content_french", ""
                            ),  # The text to be vectorized
                            metadata={
                                "source_name": data.get(
                                    "source_name", "Unknown Source"
                                ),
                                "source_reference": data.get(
                                    "source_reference", "Unknown Page"
                                ),
                                "content_arabic": data.get("content_arabic", ""),
                            },
                        )
                        documents.append(doc)

                    except json.JSONDecodeError:
                        print(f"Warning: Could not decode a line in {filename}: {line}")
                        continue
        else:
            print(f"Skipping unsupported file: {filename}")

    if not documents:
        print("No documents were created. Vector store not built.")
        return

    print(f"Successfully created {len(documents)} documents to process.")

    embeddings = OpenAIEmbeddings(model="text-embedding-3-large")

    print("Building FAISS vector store with manually crafted documents...")
    try:
        vector_store = FAISS.from_documents(documents, embeddings)
        print("Vector store built successfully.")

        vector_store.save_local(FAISS_INDEX_PATH)
        print(f"Vector store saved locally to: {FAISS_INDEX_PATH}")
    except Exception as e:
        print(f"Error building or saving the vector store: {e}")


if __name__ == "__main__":
    build_and_save_vector_store()
