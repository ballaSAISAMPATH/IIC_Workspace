from .vectorstore import get_vectorstore, vectorstores, embed_text_for_pdf
from .memory import ChromaDBChatMemory
from .llm import GeminiChatLLM
from langchain_core.messages import HumanMessage, AIMessage
from .utils import extract_text_from_file

memory_instances = {}

def embed_controller(text: str, pdf_id: str):
    embed_text_for_pdf(text, pdf_id)
    return {"message": f"Embedding stored for PDF ID: {pdf_id}"}

def _calculate_relevance_score(query: str, docs: list) -> float:
    """Calculate relevance score based on document similarity and content quality"""
    if not docs:
        return 0.0
    
    # Check average content length and quality
    avg_length = sum(len(doc.page_content) for doc in docs) / len(docs)
    
    # Minimum threshold: at least 100 chars of content per doc
    if avg_length < 100:
        return 0.0
    
    # Simple relevance heuristic: longer, more detailed docs = higher relevance
    # Scale from 0 to 1
    relevance = min(avg_length / 500, 1.0)  # 500+ chars = perfect relevance
    
    return relevance

def _is_learning_related_query(query: str) -> bool:
    """Check if query is related to learning/roadmaps/skills"""
    learning_keywords = [
        "learn", "roadmap", "skill", "course", "study", "practice", 
        "improve", "master", "understand", "how to", "guide", "tutorial",
        "week", "month", "hour", "time", "duration", "progress", "goal",
        "project", "exercise", "coding", "programming", "development",
        "backend", "frontend", "fullstack", "web", "mobile", "devops"
    ]
    
    query_lower = query.lower()
    return any(keyword in query_lower for keyword in learning_keywords)

def generate_controller(pdf_id: str, message: str, session_id: str):
    vectorstore = get_vectorstore(pdf_id) 
    if not vectorstore:
        raise ValueError("No embeddings found for this PDF ID")

    session_key = f"{pdf_id}_{session_id}"
    if session_key not in memory_instances:
        memory_instances[session_key] = ChromaDBChatMemory(pdf_id, session_id)

    memory = memory_instances[session_key]

    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
    docs = retriever.invoke(message)

    context = "\n\n".join(d.page_content for d in docs)
    history = memory.get_recent_messages()

    history_text = ""
    for msg in history[-6:]:  
        role = "Human" if isinstance(msg, HumanMessage) else "Assistant"
        history_text += f"{role}: {msg.content}\n"

    # 🔥 RELEVANCE CHECK
    relevance_score = _calculate_relevance_score(message, docs)
    is_learning_query = _is_learning_related_query(message)
    
    # Use RAG if: score > 0.4 AND query is learning-related
    has_relevant_context = relevance_score > 0.4 and is_learning_query

    if has_relevant_context:
        # 1️⃣ RAG MODE: Use context from embeddings (bounded to PDF)
        prompt = f"""Context from learning resource:
{context}

Conversation:
{history_text}

User: {message}

Based on the provided context, answer the user's question in a supportive and encouraging manner.
"""
        mode = "rag"
    elif is_learning_query:
        # 2️⃣ FALLBACK MODE: General knowledge for learning-related queries
        prompt = f"""You are a supportive learning mentor helping with roadmaps and skill development.
Be encouraging, constructive, and helpful.

Conversation:
{history_text}

User: {message}

Provide thoughtful guidance on learning and skill development. Be supportive and motivate the learner.
"""
        mode = "general_knowledge"
    else:
        # 3️⃣ OUT OF SCOPE: Query not related to learning
        prompt = f"""You are a helpful assistant but your specialty is learning roadmaps and skill development.

Conversation:
{history_text}

User: {message}

Politely redirect the conversation back to learning and skill development topics.
Say something like: "I'm specifically designed to help with learning roadmaps and skill development. 
Can I help you with your learning goals instead?"
"""
        mode = "out_of_scope"

    llm = GeminiChatLLM()
    answer = llm.invoke(prompt)

    memory.add_message(HumanMessage(content=message))
    memory.add_message(AIMessage(content=answer))

    return {
        "answer": answer,
        "source_documents": len(docs),
        "relevance_score": round(relevance_score, 2),
        "context_type": mode,  # "rag", "general_knowledge", or "out_of_scope"
        "session_id": session_id,
        "message_count": memory.get_message_count()
    }

async def embed_file_controller(file, pdf_id: str):
    text = await extract_text_from_file(file)
    embed_text_for_pdf(text, pdf_id)
    return {
        "message": f"File embedded successfully for PDF ID: {pdf_id}",
        "chars_embedded": len(text)
    }