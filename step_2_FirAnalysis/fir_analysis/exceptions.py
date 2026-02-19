from fastapi import HTTPException, status


class FIRTooLargeError(HTTPException):
    def __init__(self, size: int, limit: int):
        super().__init__(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"FIR text is {size} bytes; limit is {limit} bytes.",
        )


class ExtractionError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"FIR extraction failed: {detail}",
        )


class LegalAnalysisError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Legal analysis (Gemini) failed: {detail}",
        )


class OllamaUnavailableError(HTTPException):
    def __init__(self, detail: str = ""):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                f"Ollama endpoint is not reachable: {detail}. "
                f"Check OLLAMA_BASE_URL in your .env file."
            ),
        )


class GeminiUnavailableError(HTTPException):
    def __init__(self, detail: str = ""):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Gemini API error: {detail}",
        )