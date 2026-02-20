from pydantic import BaseModel
from typing import Optional

class EmbedRequest(BaseModel):
    text: str
    pdfId: str

class GenerateRequest(BaseModel):
    pdfId: str
    message: str
    sessionId: Optional[str] = "default"
