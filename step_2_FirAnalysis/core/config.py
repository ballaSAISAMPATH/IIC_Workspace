from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Ollama (OpenAI-compatible endpoint — e.g. ngrok tunnel or local)
    OLLAMA_BASE_URL: str = "http://localhost:11434"   # override in .env
    OLLAMA_MODEL: str = "llama3.1:8b"                # override in .env
    OLLAMA_API_KEY: str = "ollama"                   # ngrok/proxy may need a key; set "ollama" if none required

    # Gemini (cloud LLM for legal analysis)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-pro"

    # Security
    SECRET_KEY: str = "change-me-in-production-32-chars!"
    MASK_SALT: str = "fir-mask-salt-2024"

    # App behaviour
    MAX_FIR_SIZE_BYTES: int = 500_000     # 500 KB upload limit
    DEBUG: bool = False

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()