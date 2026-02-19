from dotenv import load_dotenv
import os
import chromadb

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

chroma_client = chromadb.PersistentClient(path="./chroma_db")
