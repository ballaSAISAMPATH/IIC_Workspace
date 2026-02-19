# rag_chat/utils.py
from fastapi import UploadFile
from resume_analysis.utils import extract_resume_text_from_bytes  # reuse your existing logic

async def extract_text_from_file(file: UploadFile) -> str:
    content = await file.read()
    text = extract_resume_text_from_bytes(content, filename=file.filename)
    return text
