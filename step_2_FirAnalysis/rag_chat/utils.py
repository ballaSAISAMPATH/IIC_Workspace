from fastapi import UploadFile
from resume_analysis.utils import extract_resume_text_from_bytes 

async def extract_text_from_file(file: UploadFile) -> str:
    content = await file.read()
    text = extract_resume_text_from_bytes(content, filename=file.filename)
    return text
