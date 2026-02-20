import uuid
from datetime import datetime
from typing import List
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from .config import chroma_client
from datetime import datetime

class ChromaDBChatMemory:
    def __init__(self, pdf_id: str, session_id: str, k: int = 5):
        self.pdf_id = pdf_id
        self.session_id = session_id
        self.k = k
        self.collection_name = f"chat_history_{pdf_id}{session_id}".replace("-", "")
        try:
            self.collection = chroma_client.create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )
        except Exception:
            self.collection = chroma_client.get_collection(name=self.collection_name)

    def add_message(self, message: BaseMessage):
        message_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        self.collection.add(
            documents=[message.content],
            metadatas=[{
                "content": message.content,
                "type": "human" if isinstance(message, HumanMessage) else "ai",
                "timestamp": timestamp,
                "pdf_id": self.pdf_id,
                "session_id": self.session_id
            }],
            ids=[message_id]
        )
    def get_recent_messages(self) -> List[BaseMessage]:
        results = self.collection.get(include=["documents", "metadatas"])
        if not results["documents"]:
            return []

        messages = list(zip(results["documents"], results["metadatas"]))
        messages.sort(key=lambda x: datetime.fromisoformat(x[1]["timestamp"]))
        recent = messages[-self.k * 2:]

        output = []
        for content, meta in recent:
            if meta["type"] == "human":
                output.append(HumanMessage(content=content))
            else:
                output.append(AIMessage(content=content))
        return output
    def get_message_count(self) -> int:
        results = self.collection.get()
        return len(results["documents"])
