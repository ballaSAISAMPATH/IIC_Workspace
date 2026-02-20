"""
FIRAnalysisService
──────────────────
1. [Ollama] Extract structured fields + entity list from raw FIR text.
2. [local]  Mask PII using PIIMasker → build MaskedFIRPayload.
3. [Gemini] Send masked payload for legal analysis.
"""

from datetime import date
from typing import Any

import httpx

from core.llm import OllamaClient, GeminiClient
from core.security import PIIMasker
from fir_analysis.schemas import (
    FIRExtractedFields,
    MaskedFIRPayload,
    MaskPreviewResponse,
    MaskEntry,
    LegalAnalysis,
    FIRAnalysisResponse,
)
from fir_analysis.constants import (
    EXTRACTION_SYSTEM_PROMPT,
    EXTRACTION_PROMPT_TEMPLATE,
    LEGAL_ANALYSIS_PROMPT_TEMPLATE,
)
from fir_analysis.exceptions import (
    ExtractionError,
    LegalAnalysisError,
    OllamaUnavailableError,
    GeminiUnavailableError,
)
from fir_analysis import utils


def _safe_list(value: Any) -> list:
    if not value:
        return []
    if isinstance(value, list):
        return [str(v).strip() for v in value if v and str(v).strip()]
    if isinstance(value, str):
        return [value.strip()] if value.strip() else []
    return []


def _safe_str(value: Any) -> str | None:
    if not value:
        return None
    s = str(value).strip()
    return s if s else None


class FIRAnalysisService:
    def __init__(self, ollama: OllamaClient, gemini: GeminiClient):
        self.ollama = ollama
        self.gemini = gemini

    # ── Public: full pipeline ─────────────────────────────────────────────────

    async def analyse(self, fir_text: str) -> FIRAnalysisResponse:
        extracted_raw = await self._extract_fields(fir_text)
        extracted, masked_payload, masker = self._build_and_mask(extracted_raw)
        legal_analysis = await self._legal_analysis(masked_payload)
        return FIRAnalysisResponse(
            extracted_fields=extracted,
            masked_payload=masked_payload,
            legal_analysis=legal_analysis,
        )

    # ── Public: mask preview only (no Gemini call) ────────────────────────────

    async def mask_preview(self, fir_text: str) -> MaskPreviewResponse:
        extracted_raw = await self._extract_fields(fir_text)
        extracted, masked_payload, masker = self._build_and_mask(extracted_raw)

        # Build the masking table
        masking_table = [
            MaskEntry(**entry) for entry in masker.get_mask_entries()
        ]

        # PII fields that exist in extracted but are NOT sent to Gemini
        pii_fields_hidden = {}
        if extracted.victim_name:
            pii_fields_hidden["victim_name"] = extracted.victim_name
        if extracted.victim_address:
            pii_fields_hidden["victim_address"] = extracted.victim_address
        if extracted.victim_contact:
            pii_fields_hidden["victim_contact"] = extracted.victim_contact
        if extracted.victim_age:
            pii_fields_hidden["victim_age"] = extracted.victim_age
        if extracted.victim_gender:
            pii_fields_hidden["victim_gender"] = extracted.victim_gender
        if extracted.fir_number:
            pii_fields_hidden["fir_number"] = extracted.fir_number
        if extracted.accused_names:
            pii_fields_hidden["accused_names"] = ", ".join(extracted.accused_names)
        if extracted.witness_names:
            pii_fields_hidden["witness_names"] = ", ".join(extracted.witness_names)
        if extracted.incident_location:
            pii_fields_hidden["incident_location"] = extracted.incident_location

        return MaskPreviewResponse(
            what_gemini_receives=masked_payload,
            masking_table=masking_table,
            pii_fields_hidden=pii_fields_hidden,
        )

    # ── Step 1: Ollama extraction ─────────────────────────────────────────────

    async def _extract_fields(self, fir_text: str) -> dict[str, Any]:
        prompt = EXTRACTION_PROMPT_TEMPLATE.format(fir_text=fir_text)
        try:
            data = await self.ollama.generate_json(
                prompt=prompt, system=EXTRACTION_SYSTEM_PROMPT
            )
        except httpx.ConnectError as exc:
            raise OllamaUnavailableError(str(exc))
        except httpx.ConnectTimeout as exc:
            raise OllamaUnavailableError(f"Connection timed out — {exc}")
        except httpx.RemoteProtocolError as exc:
            raise OllamaUnavailableError(f"Bad response from server — {exc}")
        except httpx.HTTPStatusError as exc:
            raise OllamaUnavailableError(
                f"HTTP {exc.response.status_code} from {exc.request.url}"
            )
        except httpx.HTTPError as exc:
            raise OllamaUnavailableError(f"{type(exc).__name__}: {exc}")
        except ValueError as exc:
            raise ExtractionError(str(exc))
        return data

    # ── Step 2: Mask + build schemas ─────────────────────────────────────────

    def _build_and_mask(
        self, raw: dict[str, Any]
    ) -> tuple[FIRExtractedFields, MaskedFIRPayload, PIIMasker]:

        extracted = FIRExtractedFields(
            fir_number=_safe_str(raw.get("fir_number")),
            police_station=_safe_str(raw.get("police_station")),
            district=_safe_str(raw.get("district")),
            date_of_filing=_safe_str(raw.get("date_of_filing")),
            date_of_incident=_safe_str(raw.get("date_of_incident")),
            time_of_incident=_safe_str(raw.get("time_of_incident")),
            victim_name=_safe_str(raw.get("victim_name")),
            victim_age=_safe_str(raw.get("victim_age")),
            victim_gender=_safe_str(raw.get("victim_gender")),
            victim_address=_safe_str(raw.get("victim_address")),
            victim_contact=_safe_str(raw.get("victim_contact")),
            accused_names=_safe_list(raw.get("accused_names")),
            witness_names=_safe_list(raw.get("witness_names")),
            incident_location=_safe_str(raw.get("incident_location")),
            incident_description=_safe_str(raw.get("incident_description")) or "",
            ipc_sections=utils.normalise_sections(_safe_list(raw.get("ipc_sections"))),
            other_acts=_safe_list(raw.get("other_acts")),
            case_nature=utils.infer_case_nature(
                _safe_str(raw.get("case_nature")),
                utils.normalise_sections(_safe_list(raw.get("ipc_sections"))),
                _safe_list(raw.get("other_acts")),
            ),
        )

        raw_entities: Any = raw.get("entities_for_masking") or {}
        if not isinstance(raw_entities, dict):
            raw_entities = {}

        entities_for_masking: dict[str, list[str]] = {
            k: _safe_list(v) for k, v in raw_entities.items()
        }

        def _add_to_bucket(bucket: str, values: list[str]) -> None:
            existing = entities_for_masking.setdefault(bucket, [])
            for v in values:
                if v and v not in existing:
                    existing.append(v)

        if extracted.victim_name:
            _add_to_bucket("person", [extracted.victim_name])
        _add_to_bucket("accused", extracted.accused_names)
        _add_to_bucket("witness", extracted.witness_names)
        if extracted.victim_address:
            _add_to_bucket("address", [extracted.victim_address])
        if extracted.victim_contact:
            _add_to_bucket("phone", [extracted.victim_contact])
        if extracted.incident_location:
            _add_to_bucket("location", [extracted.incident_location])

        masker = PIIMasker()
        masked_description = masker.mask(
            extracted.incident_description, entities_for_masking
        )

        # ── DEBUG — prints exactly what was masked in your terminal ──
        print("\n" + "="*60)
        print("🔒 MASKING TABLE (never sent to cloud)")
        print("="*60)
        entries = masker.get_mask_entries()
        if entries:
            for entry in entries:
                print(f"  [{entry['entity_type'].upper()}]  {entry['original']}  →  {entry['token']}")
        else:
            print("  (nothing masked — no PII found in description)")
        print("-"*60)
        print(f"  Original : {extracted.incident_description}")
        print(f"  Masked   : {masked_description}")
        print("="*60 + "\n")
        # ── END DEBUG ────────────────────────────────────────────────

        district_label = " / ".join(
            filter(None, [extracted.police_station, extracted.district])
        ) or "Unknown"

        masked_payload = MaskedFIRPayload(
            masked_description=masked_description,
            ipc_sections=extracted.ipc_sections,
            other_acts=extracted.other_acts,
            case_nature=extracted.case_nature,
            date_of_incident=extracted.date_of_incident,
            police_station_district=district_label,
        )

        return extracted, masked_payload, masker

    # ── Step 3: Gemini legal analysis ────────────────────────────────────────

    async def _legal_analysis(self, payload: MaskedFIRPayload) -> LegalAnalysis:

        prompt = LEGAL_ANALYSIS_PROMPT_TEMPLATE.format(
            today=date.today().isoformat(),
            date_of_incident=payload.date_of_incident or "Unknown",
            police_station_district=payload.police_station_district,
            case_nature=payload.case_nature or "General Criminal",
            ipc_sections=", ".join(payload.ipc_sections) or "Not specified",
            other_acts=", ".join(payload.other_acts) or "None",
            masked_description=payload.masked_description,
        )

        # ── DEBUG — prints the exact prompt sent to Gemini in your terminal ──
        print("\n" + "="*60)
        print("📤 PROMPT SENT TO GEMINI")
        print("="*60)
        print(prompt)
        print("="*60 + "\n")
        # ── END DEBUG ─────────────────────────────────────────────────────────

        try:
            data = await self.gemini.generate_json(prompt)
        except Exception as exc:
            raise GeminiUnavailableError(str(exc))

        try:
            return LegalAnalysis(**data)
        except Exception as exc:
            raise LegalAnalysisError(f"Schema mismatch: {exc}")