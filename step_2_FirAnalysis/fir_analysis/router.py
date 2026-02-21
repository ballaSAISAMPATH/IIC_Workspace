"""
FIR Analysis Router
───────────────────
GET  /ping-ollama    → Test Ollama connectivity
POST /mask-preview   → See exactly what is masked and what Gemini receives
POST /analyse        → Full pipeline — text input  (extract → mask → Gemini)
POST /analyse-pdf    → Full pipeline — PDF upload  (extract text → same pipeline)
POST /extract-only   → Only Ollama extraction (no Gemini, no cloud)
GET  /sections       → IPC section reference
"""

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
import httpx

from core.config import settings
from core.llm import ollama_client
from fir_analysis.schemas import (
    FIRAnalysisRequest,
    FIRAnalysisResponse,
    FIRExtractedFields,
    MaskPreviewResponse,
)
from fir_analysis.dependencies import get_fir_service
from fir_analysis.service import FIRAnalysisService
from fir_analysis.exceptions import FIRTooLargeError, OllamaUnavailableError
from fir_analysis.constants import IPC_DESCRIPTIONS
from fir_analysis.pdf_extractor import extract_text_from_pdf, validate_pdf

router = APIRouter()

@router.get(
    "/ping-ollama",
    summary="Test Ollama Connection",
)
async def ping_ollama():
    try:
        response = await ollama_client.generate(prompt="Reply with just the word PONG.")
        return {
            "status": "ok",
            "ollama_url": settings.OLLAMA_BASE_URL,
            "model": settings.OLLAMA_MODEL,
            "response": response,
        }
    except httpx.ConnectError as exc:
        raise OllamaUnavailableError(str(exc))
    except httpx.HTTPStatusError as exc:
        raise OllamaUnavailableError(
            f"HTTP {exc.response.status_code} — {exc.response.text[:200]}"
        )
    except httpx.HTTPError as exc:
        raise OllamaUnavailableError(f"{type(exc).__name__}: {exc}")

@router.post(
    "/mask-preview",
    response_model=MaskPreviewResponse,
    summary="Mask Preview — See What Gemini Receives",
    description=(
        "Runs extraction + masking locally (Ollama only, no Gemini call). "
        "Shows: (1) the exact payload that would be sent to Gemini, "
        "(2) which tokens replaced which real values, "
        "(3) which PII fields are hidden from the cloud entirely."
    ),
)
async def mask_preview(
    req: FIRAnalysisRequest,
    service: FIRAnalysisService = Depends(get_fir_service),
) -> MaskPreviewResponse:
    _check_size(req.fir_text)
    return await service.mask_preview(req.fir_text)


@router.post(
    "/analyse",
    response_model=FIRAnalysisResponse,
    summary="Full FIR Analysis",
    description=(
        "Extracts all FIR fields (Ollama), masks PII, "
        "then sends anonymised description to Gemini for legal analysis."
    ),
)
async def analyse_fir(
    req: FIRAnalysisRequest,
    service: FIRAnalysisService = Depends(get_fir_service),
) -> FIRAnalysisResponse:
    _check_size(req.fir_text)
    return await service.analyse(req.fir_text)


@router.post(
    "/analyse-pdf",
    response_model=FIRAnalysisResponse,
    summary="Full FIR Analysis from PDF",
    description=(
        "Upload a FIR as a PDF file (digital or scanned). "
        "Text is extracted locally (pdfplumber for digital, Tesseract OCR for scanned), "
        "then the same extract → mask → Gemini pipeline runs. "
        "The PDF never leaves your server — only the masked text goes to Gemini."
    ),
)
async def analyse_fir_pdf(
    file: UploadFile = File(..., description="FIR PDF file (digital or scanned)"),
    service: FIRAnalysisService = Depends(get_fir_service),
) -> FIRAnalysisResponse:

    file_bytes = await file.read()

    try:
        validate_pdf(file_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    try:
        fir_text, method = extract_text_from_pdf(file_bytes)
    except RuntimeError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    if len(fir_text.strip()) < 50:
        raise HTTPException(
            status_code=422,
            detail=(
                "Could not extract readable text from the PDF. "
                "If this is a scanned FIR, ensure Tesseract OCR is installed. "
                f"Extraction method tried: {method}"
            ),
        )

    _check_size(fir_text)

    response = await service.analyse(fir_text)

    return response

@router.post(
    "/extract-only",
    response_model=FIRExtractedFields,
    summary="Local Extraction Only (no cloud)",
)
async def extract_only(
    req: FIRAnalysisRequest,
    service: FIRAnalysisService = Depends(get_fir_service),
) -> FIRExtractedFields:
    _check_size(req.fir_text)
    raw = await service._extract_fields(req.fir_text)
    extracted, _, _ = service._build_and_mask(raw)
    return extracted



@router.get(
    "/sections",
    summary="IPC Section Reference",
    response_model=dict[str, str],
)
async def ipc_sections() -> dict[str, str]:
    return IPC_DESCRIPTIONS

def _check_size(text: str) -> None:
    size = len(text.encode("utf-8"))
    if size > settings.MAX_FIR_SIZE_BYTES:
        raise FIRTooLargeError(size, settings.MAX_FIR_SIZE_BYTES)