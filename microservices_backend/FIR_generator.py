from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, START, END
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import os

load_dotenv()

model =  ChatGroq(
            model= "llama-3.1-8b-instant",
            api_key=os.getenv("GROQ_API_KEY"),
            temperature=0.7,
      )

class FirSchema(BaseModel):
      topic : str = Field(description="The topic on which the description has to be written")
      des : str =  Field(description="10 line about the topic and 5 questions on the description")

def generate(state:FirSchema):
      prompt = f"Write a 10 line description on {state.topic} and also write 5 questions on the description"
      response = model.invoke(prompt)
      state.des = response.content
      return state

graph = StateGraph(FirSchema)
graph.add_node("generate", generate)
graph.add_edge(START, "generate")
graph.add_edge("generate", END)

compiled_graph = graph.compile()
result = compiled_graph.invoke({"topic":"iron man", "des":""})
print(result["des"])