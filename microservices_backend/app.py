import json

from fastapi import FastAPI
from FIR_generator import compiled_graph
app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/FIR_filing")
async def FIR_generator(FIR_TEXT: str):
      # FIR_TEXT = """
      #       On 15th April 2025, the complainant Rahul Mehta, aged 32 years,
      #       resident of Secunderabad, received multiple phone calls and WhatsApp
      #       messages from an unknown person claiming to be a bank officer.
      #       The accused obtained debit card details and OTP and transferred
      #       ₹1,30,000/- online. The accused threatened false cases if reported.
      #       """
      output = compiled_graph.invoke({"fir_text": FIR_TEXT})
      print(json.dumps(output["fir"].model_dump(), indent=2))
      return {"message":output["fir"]}
