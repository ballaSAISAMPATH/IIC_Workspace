"""
Dependency injection for FIR analysis endpoints.

Usage in router:
    from fastapi import Depends
    from app.fir_analysis.dependencies import get_fir_service

    @router.post("/analyse")
    async def analyse(service: FIRAnalysisService = Depends(get_fir_service)):
        ...
"""

from fastapi import Depends

from core.llm import OllamaClient, GeminiClient, ollama_client, gemini_client
from fir_analysis.service import FIRAnalysisService



def get_ollama_client() -> OllamaClient:
    """Returns the shared Ollama client singleton."""
    return ollama_client


def get_gemini_client() -> GeminiClient:
    """Returns the shared Gemini client singleton."""
    return gemini_client



def get_fir_service(
    ollama: OllamaClient = Depends(get_ollama_client),
    gemini: GeminiClient = Depends(get_gemini_client),
) -> FIRAnalysisService:
    """
    FastAPI dependency that builds and returns a FIRAnalysisService.

    FastAPI resolves get_ollama_client and get_gemini_client first,
    then passes their return values here automatically.

    In tests, override with:
        app.dependency_overrides[get_fir_service] = lambda: FIRAnalysisService(mock_ollama, mock_gemini)
    """
    return FIRAnalysisService(ollama=ollama, gemini=gemini)