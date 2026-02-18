from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, START, END
from pydantic import BaseModel, Field
from typing import List
from encryption_template import encryption_prompt
from FIR_generation_template import FIR_generation_prompt
from dotenv import load_dotenv
import os

load_dotenv()


model = ChatGroq(
    model="llama-3.1-8b-instant",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0
)

class narration_encrypted_output_format(BaseModel):
      encrypted_narration: str = Field(
            description="The FIR narration with sensitive information replaced by placeholders"
      )
      mapping: dict = Field(
            description="A dictionary mapping placeholders to original sensitive values"
      )

class SectionExtraction(BaseModel):
    facts_summary: str = Field(
        description="Summary of offence-related facts"
    )
    suggested_sections: List[str] = Field(
        description="Clearly applicable BNS sections"
    )
    accused_names: List[str] = Field(
        description="List of accused names identified in the FIR"
    )
    victim_names: List[str] = Field(
            description="List of victim names identified in the FIR"
      )     
    

encryption_model = model.with_structured_output(narration_encrypted_output_format)
structured_llm = model.with_structured_output(SectionExtraction)

def encrypt_narration(state: dict):
      message= encryption_prompt.format_messages(text=state["fir_text"])
      result = encryption_model.invoke(message)
      print("encrypted_narration: ", result.encrypted_narration)
      print("\n\n\n\n")
      print("Mapping:", result.mapping)
      print("\n\n\n\n")
      return {
            "encrypted_narration": result.encrypted_narration,
            "mapping": result.mapping
      }

      result= encryption_model.invoke()
def extract_sections(state: dict):
      message = FIR_generation_prompt.format_messages(FIR_narration=state["encrypted_narration"])
      result = structured_llm.invoke(message)

      return {
            "facts_summary": result.facts_summary,
            "suggested_sections": result.suggested_sections,
            "accused_names": result.accused_names,
            "victim_names": result.victim_names
      }

graph = StateGraph(dict)
graph.add_node("extract_sections", extract_sections)
graph.add_node("encrypt_narration", encrypt_narration)

graph.add_edge(START, "encrypt_narration")
graph.add_edge("encrypt_narration", "extract_sections")
graph.add_edge("extract_sections", END)

compiled_graph = graph.compile()

FIR_TEXT = """
On 12th January 2025 at around 8:30 PM, the complainant Ramesh Kumar
was returning home near MG Road, Bengaluru. The accused Rajesh and Mohan
wrongfully restrained him and assaulted him using an iron rod, causing
a fracture in his left arm. The accused also threatened him with dire
consequences if he reported the matter to the police.
"""

output = compiled_graph.invoke({
    "fir_text": FIR_TEXT
})

print("FACTS SUMMARY:", output["facts_summary"])
print("SUGGESTED SECTIONS:", output["suggested_sections"])
print("ACCUSED NAMES:", output["accused_names"])
print("VICTIM NAMES:", output["victim_names"])
