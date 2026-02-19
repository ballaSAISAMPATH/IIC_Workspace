import os
import requests
from typing import Optional, List
from langchain_core.language_models import LLM
from langchain_core.callbacks import CallbackManagerForLLMRun

class GeminiChatLLM(LLM):
    model_name: str = "gemini-flash-latest"
    api_key: str = os.getenv("GEMINI_API_KEY")

    @property
    def _llm_type(self) -> str:
        return "gemini_chat_llm"

    @property
    def _identifying_params(self):
        return {"model_name": self.model_name}

    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
    ) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"
        headers = {
            "Content-Type": "application/json",
            "X-goog-api-key": self.api_key
        }
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }

        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()

        return response.json()["candidates"][0]["content"]["parts"][0]["text"]
