import os
import pickle
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

vectorstores = {}
VECTORSTORE_DIR = "vectorstores_storage"  # Persistent storage directory

# Create directory if it doesn't exist
os.makedirs(VECTORSTORE_DIR, exist_ok=True)

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def embed_text_for_pdf(text: str, pdf_id: str):
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    docs = splitter.create_documents([text])

    vectorstore = FAISS.from_documents(docs, embeddings)
    vectorstores[pdf_id] = vectorstore
    
    # 🔥 PERSIST TO DISK
    save_path = os.path.join(VECTORSTORE_DIR, pdf_id)
    vectorstore.save_local(save_path)
    
    return vectorstore

def load_vectorstore(pdf_id: str):
    """Load vectorstore from disk if it exists"""
    save_path = os.path.join(VECTORSTORE_DIR, pdf_id)
    
    if os.path.exists(save_path):
        vectorstore = FAISS.load_local(save_path, embeddings, allow_dangerous_deserialization=True)
        vectorstores[pdf_id] = vectorstore
        return vectorstore
    
    return None

def get_vectorstore(pdf_id: str):
    """Get vectorstore from memory, or load from disk"""
    # Check memory first
    if pdf_id in vectorstores:
        return vectorstores[pdf_id]
    
    # Try to load from disk
    vectorstore = load_vectorstore(pdf_id)
    if vectorstore:
        return vectorstore
    
    # Not found
    return None