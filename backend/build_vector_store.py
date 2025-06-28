import os
from langchain_community.document_loaders import TextLoader # Pour les fichiers .txt
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from dotenv import load_dotenv

load_dotenv()

KNOWLEDGE_BASE_PATH = "app/core/islamic_knowledge_base.txt"
# Chemin où sauvegarder le vector store
FAISS_INDEX_PATH = "faiss_index" # Créera un dossier 'faiss_index' à la racine du backend

def build_and_save_vector_store():
    if not os.path.exists(KNOWLEDGE_BASE_PATH):
        print(f"Erreur: Le fichier de base de connaissances '{KNOWLEDGE_BASE_PATH}' n'existe pas.")
        print("Veuillez créer le fichier et y ajouter du contenu.")
        return

    print(f"Chargement de la base de connaissances depuis : {KNOWLEDGE_BASE_PATH}")
    # Utilisation de TextLoader pour les fichiers .txt
    loader = TextLoader(KNOWLEDGE_BASE_PATH, encoding='utf-8')
    docs = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    all_splits = text_splitter.split_documents(docs)

    print(f"Nombre de chunks générés : {len(all_splits)}")

    embeddings = OpenAIEmbeddings(model="text-embedding-3-large")

    print("Construction du vector store FAISS...")
    try:
        vector_store = FAISS.from_documents(all_splits, embeddings)
        print("Vector store construit avec succès.")

        # Sauvegarde du vector store
        vector_store.save_local(FAISS_INDEX_PATH)
        print(f"Vector store sauvegardé localement à : {FAISS_INDEX_PATH}")
    except Exception as e:
        print(f"Error building or saving the vector store: {e}")

if __name__ == "__main__":
    build_and_save_vector_store()