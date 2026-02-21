"""
PDF → plain text extractor for FIR documents.

Handles two types of PDFs:
  1. Digital PDF  — has a text layer (most e-FIRs from police portals)
                    → use pdfplumber (preserves layout better than pypdf)
  2. Scanned PDF  — image only, no text layer (physical FIR photocopied & scanned)
                    → convert pages to images → OCR via pytesseract

Detection: if pdfplumber extracts fewer than MIN_CHARS_FOR_DIGITAL characters
           across all pages, we assume it's a scanned PDF and fall back to OCR.

Dependencies:
    pip install pdfplumber pytesseract pdf2image pillow
    Also install Tesseract binary:
        Windows  → https://github.com/UB-Mannheim/tesseract/wiki
        Ubuntu   → sudo apt install tesseract-ocr
        macOS    → brew install tesseract
"""

import io
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

MIN_CHARS_FOR_DIGITAL = 100


def extract_text_from_pdf(file_bytes: bytes) -> tuple[str, str]:
    """
    Extract text from PDF bytes.

    Returns
    -------
    text        : extracted plain text
    method_used : "digital" | "ocr"  (for debug/logging)
    """
    try:
        import pdfplumber
        text = _extract_digital(file_bytes)
        if len(text.strip()) >= MIN_CHARS_FOR_DIGITAL:
            logger.info(f"PDF extracted digitally ({len(text)} chars)")
            return text.strip(), "digital"
        logger.info(
            f"Digital extraction yielded only {len(text)} chars — "
            f"falling back to OCR"
        )
    except Exception as exc:
        logger.warning(f"pdfplumber failed: {exc} — trying OCR")

    try:
        text = _extract_ocr(file_bytes)
        logger.info(f"PDF extracted via OCR ({len(text)} chars)")
        return text.strip(), "ocr"
    except ImportError:
        raise RuntimeError(
            "This PDF appears to be scanned (no text layer) and OCR dependencies "
            "are not installed. Run: pip install pytesseract pdf2image pillow\n"
            "Also install Tesseract: https://github.com/UB-Mannheim/tesseract/wiki"
        )
    except Exception as exc:
        raise RuntimeError(f"OCR extraction failed: {exc}")


def _extract_digital(file_bytes: bytes) -> str:
    """Extract text from a digital (text-layer) PDF using pdfplumber."""
    import pdfplumber

    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for i, page in enumerate(pdf.pages):
            page_text = page.extract_text(x_tolerance=2, y_tolerance=2)
            if page_text:
                text_parts.append(f"--- Page {i + 1} ---\n{page_text}")
    return "\n\n".join(text_parts)


def _extract_ocr(file_bytes: bytes) -> str:
    """Extract text from a scanned PDF using Tesseract OCR."""
    import pytesseract
    from pdf2image import convert_from_bytes
    from PIL import Image

    images: list[Image.Image] = convert_from_bytes(
        file_bytes,
        dpi=300,
        fmt="jpeg",
    )

    text_parts = []
    for i, image in enumerate(images):
        page_text = pytesseract.image_to_string(image, lang="eng")
        if page_text.strip():
            text_parts.append(f"--- Page {i + 1} ---\n{page_text}")

    return "\n\n".join(text_parts)


def validate_pdf(file_bytes: bytes) -> None:
    """
    Basic validation — raises ValueError with a user-friendly message
    if the uploaded file doesn't look like a PDF.
    """
    if not file_bytes:
        raise ValueError("Uploaded file is empty.")
    if not file_bytes.startswith(b"%PDF"):
        raise ValueError(
            "Uploaded file does not appear to be a valid PDF "
            "(missing PDF header). Please upload a .pdf file."
        )
    if len(file_bytes) > 20 * 1024 * 1024:
        raise ValueError(
            f"PDF is too large ({len(file_bytes) // (1024*1024)} MB). "
            f"Maximum allowed size is 20 MB."
        )