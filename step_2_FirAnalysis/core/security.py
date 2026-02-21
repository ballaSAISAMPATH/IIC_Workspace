"""
PII Masking & unmasking utilities.
"""

import hashlib
from core.config import settings


class PIIMasker:
    ENTITY_PREFIXES = {
        "person": "PERSON",
        "witness": "WITNESS",
        "accused": "ACCUSED",
        "location": "LOCATION",
        "phone": "PHONE",
        "aadhaar": "AADHAAR",
        "address": "ADDRESS",
        "vehicle": "VEHICLE",
    }

    def __init__(self):
        self._token_to_real: dict[str, str] = {}
        self._real_to_token: dict[str, str] = {}
        self._token_to_type: dict[str, str] = {}   
        self._counters: dict[str, int] = {}

    def mask(self, text: str, entities: dict[str, list[str]]) -> str:
        for entity_type, values in entities.items():
            if not values or not isinstance(values, list):
                continue
            prefix = self.ENTITY_PREFIXES.get(entity_type, entity_type.upper())
            for value in values:
                if not value or not isinstance(value, str):
                    continue
                value = value.strip()
                if not value or value in self._real_to_token:
                    continue
                token = self._make_token(prefix)
                self._real_to_token[value] = token
                self._token_to_real[token] = value
                self._token_to_type[token] = entity_type
                text = text.replace(value, token)
        return text

    def unmask(self, text: str) -> str:
        for token, real in self._token_to_real.items():
            text = text.replace(token, real)
        return text

    def get_mapping(self) -> dict[str, str]:
        """token → real value"""
        return dict(self._token_to_real)

    def get_mask_entries(self) -> list[dict]:
        """
        Returns a list of dicts with token, original, entity_type.
        Used by the /mask-preview endpoint.
        """
        return [
            {
                "token": token,
                "original": real,
                "entity_type": self._token_to_type.get(token, "unknown"),
            }
            for token, real in self._token_to_real.items()
        ]

    def _make_token(self, prefix: str) -> str:
        count = self._counters.get(prefix, 0)
        self._counters[prefix] = count + 1
        label = self._index_to_label(count)
        return f"[{prefix}_{label}]"

    @staticmethod
    def _index_to_label(n: int) -> str:
        result = ""
        while True:
            result = chr(ord("A") + n % 26) + result
            n = n // 26 - 1
            if n < 0:
                break
        return result