import os
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- Configuration ---
# Directory containing the knowledge base files (.txt, .pdf)
KNOWLEDGE_BASE_DIR = "app/core/knowledge_base"
# Path where the FAISS vector store will be saved
FAISS_INDEX_PATH = "faiss_index"

def build_and_save_vector_store():
    """
    Loads documents from the knowledge base, splits them into chunks,
    creates embeddings, and builds a FAISS vector store.
    The vector store is then saved to disk.
    """
    if not os.path.exists(KNOWLEDGE_BASE_DIR):
        print(f"Error: The knowledge base directory '{KNOWLEDGE_BASE_DIR}' does not exist.")
        print("Please create the directory and add .txt or .pdf files to it.")
        return

    print(f"Loading documents from: {KNOWLEDGE_BASE_DIR}")
    documents = []
    # Iterate over files in the knowledge base directory
    for filename in os.listdir(KNOWLEDGE_BASE_DIR):
        file_path = os.path.join(KNOWLEDGE_BASE_DIR, filename)
        # Load text files
        if filename.endswith(".txt"):
            loader = TextLoader(file_path, encoding='utf-8')
            documents.extend(loader.load())
            print(f"Loaded {filename} (text file).")
        # Load PDF files
        elif filename.endswith(".pdf"):
            loader = PyPDFLoader(file_path)
            documents.extend(loader.load())
            print(f"Loaded {filename} (PDF file).")
        else:
            print(f"Skipping unsupported file: {filename}")

    if not documents:
        print("No supported documents found in the knowledge base directory. Vector store not built.")
        return

    # Split documents into smaller chunks for processing
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    all_splits = text_splitter.split_documents(documents)

    print(f"Number of chunks generated: {len(all_splits)}")

    # Initialize OpenAI embeddings model
    embeddings = OpenAIEmbeddings(model="text-embedding-3-large")

    print("Building FAISS vector store...")
    try:
        # Create FAISS vector store from document splits and embeddings
        vector_store = FAISS.from_documents(all_splits, embeddings)
        print("Vector store built successfully.")

        # Save the vector store locally
        vector_store.save_local(FAISS_INDEX_PATH)
        print(f"Vector store saved locally to: {FAISS_INDEX_PATH}")
    except Exception as e:
        print(f"Error building or saving the vector store: {e}")

if __name__ == "__main__":
    # This block runs when the script is executed directly
    build_and_save_vector_store()
