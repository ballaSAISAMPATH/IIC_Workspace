from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from core.config import settings
from fir_analysis.router import router as fir_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🚀 FIR Analyser starting — Ollama: {settings.OLLAMA_BASE_URL}")
    yield
    print("🛑 FIR Analyser shutting down")


app = FastAPI(
    title="FIR Analyser API",
    description=(
        "Analyses police FIRs: extracts structured fields, masks PII, "
        "and provides AI-powered legal outcome predictions."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fir_router, prefix="/api/v1/fir", tags=["FIR Analysis"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "FIR Analyser"}