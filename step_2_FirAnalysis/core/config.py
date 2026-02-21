from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    OLLAMA_BASE_URL: str = "http://localhost:11434"   
    OLLAMA_MODEL: str = "llama3.1:8b"                
    OLLAMA_API_KEY: str = "ollama"                   
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-pro"

    SECRET_KEY: str = "change-me-in-production-32-chars!"
    MASK_SALT: str = "fir-mask-salt-2024"

    MAX_FIR_SIZE_BYTES: int = 500_000     
    DEBUG: bool = False

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()