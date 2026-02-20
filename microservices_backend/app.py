import json

from fastapi import FastAPI, Body
from FIR_generator import compiled_graph
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
app = FastAPI()
class FIRRequest(BaseModel):
    FIR_TEXT: str
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],  # IMPORTANT: allows OPTIONS
    allow_headers=["*"],
)
@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/FIR_filing")
async def FIR_generator(req: FIRRequest):
    print("Received FIR text:",req.FIR_TEXT)
      # FIR_TEXT = """
      #       On 15th April 2025, the complainant Rahul Mehta, aged 32 years,
      #       resident of Secunderabad, received multiple phone calls and WhatsApp
      #       messages from an unknown person claiming to be a bank officer.
      #       The accused obtained debit card details and OTP and transferred
      #       ₹1,30,000/- online. The accused threatened false cases if reported.
      #       """
    output = compiled_graph.invoke({"fir_text": req.FIR_TEXT})
    print(json.dumps(output["fir"].model_dump(), indent=2))
    return {"message":output["fir"]}
