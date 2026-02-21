"""
LLM clients:
  - OllamaClient  → OpenAI-compatible /v1/chat/completions endpoint
                    (works with ngrok tunnel, LM Studio, Ollama, vLLM, etc.)
  - GeminiClient  → Google Gemini via google-generativeai SDK (legal analysis)

All config (URLs, keys, model names) is read from Settings — nothing hardcoded.
"""

import json
import httpx
from typing import Any

import google.generativeai as genai

from core.config import settings



class OllamaClient:
    """
    Calls any OpenAI-compatible endpoint.
    Reads from .env:
        OLLAMA_BASE_URL  — e.g. https://xxxx.ngrok-free.app
        OLLAMA_MODEL     — e.g. llama3.1:8b
        OLLAMA_API_KEY   — bearer token if your proxy requires one
    """

    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.model = settings.OLLAMA_MODEL
        self.api_key = settings.OLLAMA_API_KEY

    def _headers(self) -> dict[str, str]:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

    def _payload(self, messages: list[dict], temperature: float = 0.1) -> dict[str, Any]:
        return {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
        }

    async def generate(self, prompt: str, system: str = "") -> str:
        """Send a prompt and return the assistant text response."""
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{self.base_url}/v1/chat/completions",
                headers=self._headers(),
                json=self._payload(messages),
            )
            resp.raise_for_status()

        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()

    async def generate_json(self, prompt: str, system: str = "") -> dict:
        """Call generate() and parse the JSON response."""
        raw = await self.generate(prompt, system)

        raw = raw.strip()
        if raw.startswith("```"):
            parts = raw.split("```")
            raw = parts[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        try:
            return json.loads(raw)
        except json.JSONDecodeError as exc:
            raise ValueError(
                f"Ollama returned non-JSON output:\n{raw[:400]}"
            ) from exc


class GeminiClient:
    """
    Reads from .env:
        GEMINI_API_KEY  — Google AI Studio key
        GEMINI_MODEL    — e.g. gemini-1.5-pro
    """

    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)

    async def generate(self, prompt: str) -> str:
        import asyncio
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=4096,
                ),
            ),
        )
        return response.text.strip()

    async def generate_json(self, prompt: str) -> dict:
        raw = await self.generate(prompt)
        raw = raw.strip()
        if raw.startswith("```"):
            parts = raw.split("```")
            raw = parts[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        try:
            return json.loads(raw)
        except json.JSONDecodeError as exc:
            raise ValueError(
                f"Gemini returned non-JSON output:\n{raw[:400]}"
            ) from exc


ollama_client = OllamaClient()
gemini_client = GeminiClient()