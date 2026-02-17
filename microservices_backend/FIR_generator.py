from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, START, END
from dotenv import load_dotenv
import os

load_dotenv()

model =  ChatGroq(
            api_key=os.getenv("GROQ_API_KEY")
      )