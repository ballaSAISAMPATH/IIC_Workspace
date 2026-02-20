from fastapi import UploadFile, File, Form
from fastapi import APIRouter, HTTPException
from .schemas import EmbedRequest, GenerateRequest
from .controllers import embed_controller, embed_file_controller, generate_controller

router = APIRouter(prefix="/rag", tags=["RAG Chat"])

@router.post("/embed")
async def embed_text(req: EmbedRequest):
    try:
        return embed_controller(req.text, req.pdfId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/embed-file")
async def embed_file(
    pdfId: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        return await embed_file_controller(file, pdfId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/generate")
async def generate_answer(req: GenerateRequest):
    try:
        return generate_controller(req.pdfId, req.message, req.sessionId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



