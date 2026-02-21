from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional



class FIRAnalysisRequest(BaseModel):
    fir_text: str = Field(
        ...,
        min_length=100,
        description="Full text of the FIR as copied from the document.",
    )
    language: str = Field(
        default="en",
        description="Language of the FIR text (en / hi / te / ta …).",
    )



class FIRExtractedFields(BaseModel):
    fir_number: Optional[str] = None
    police_station: Optional[str] = None
    district: Optional[str] = None
    date_of_filing: Optional[str] = None
    date_of_incident: Optional[str] = None
    time_of_incident: Optional[str] = None

    victim_name: Optional[str] = None
    victim_age: Optional[str] = None
    victim_gender: Optional[str] = None
    victim_address: Optional[str] = None
    victim_contact: Optional[str] = None

    accused_names: list[str] = []
    witness_names: list[str] = []

    incident_location: Optional[str] = None
    incident_description: str = ""

    ipc_sections: list[str] = []
    other_acts: list[str] = []
    case_nature: Optional[str] = None



class MaskEntry(BaseModel):
    token: str = Field(description="Token used in place of real value, e.g. [PERSON_A]")
    original: str = Field(description="The real value that was replaced")
    entity_type: str = Field(description="Category: person / accused / location / phone …")


class MaskedFIRPayload(BaseModel):
    masked_description: str = Field(
        description="Incident description with all PII replaced by tokens"
    )
    ipc_sections: list[str]
    other_acts: list[str]
    case_nature: Optional[str]
    date_of_incident: Optional[str]
    police_station_district: Optional[str]


class MaskPreviewResponse(BaseModel):
    """
    Shows exactly what is sent to Gemini and what was masked.
    Use this to verify no PII leaks to the cloud.
    """
    what_gemini_receives: MaskedFIRPayload = Field(
        description="The exact payload forwarded to Gemini — zero PII"
    )
    masking_table: list[MaskEntry] = Field(
        description="Token ↔ real value mapping (never leaves your server)"
    )
    pii_fields_hidden: dict[str, str] = Field(
        description="Structured PII fields extracted but NOT sent to Gemini"
    )



class PastCaseCreate(BaseModel):
    title: str = Field(..., description="Case title or citation, e.g. 'State vs Raju 2019'")
    court: str = Field(..., description="Court name, e.g. 'Sessions Court, Hyderabad'")
    year: int = Field(..., ge=1950, le=2100)
    ipc_sections: list[str] = Field(..., description="IPC sections involved, e.g. ['IPC 379']")
    case_nature: str = Field(..., description="Nature of case, e.g. 'Theft'")
    facts: str = Field(..., description="Brief facts of the case (2-5 sentences)")
    judgement: str = Field(..., description="What the court decided and why")
    outcome: str = Field(..., description="Convicted / Acquitted / Settled / Compounded")
    sentence_or_relief: str = Field(..., description="Sentence given or relief granted")
    source_url: Optional[str] = Field(None, description="URL to full judgement if available")


class PastCaseResponse(BaseModel):
    id: int
    title: str
    court: str
    year: int
    ipc_sections: list[str]
    case_nature: str
    facts: str
    judgement: str
    outcome: str
    sentence_or_relief: str
    source_url: Optional[str] = None
    added_at: str


class RelevantCasesResponse(BaseModel):
    matched_count: int
    cases: list[PastCaseResponse]



class LegalAnalysis(BaseModel):
    estimated_duration_months: dict = Field(
        description="min / max / typical months to resolve at trial, district, high court."
    )
    cost_estimate_inr: dict = Field(
        description="Ranges: advocate_fees / court_fees / misc / total."
    )
    win_probability_percent: int = Field(ge=0, le=100)
    win_probability_reasoning: str
    key_strengths: list[str]
    key_weaknesses: list[str]
    recommended_action: str
    recommended_action_reasoning: str
    similar_past_cases: list[dict] = Field(
        default=[],
        description="Real Indian court cases similar to this one, with outcome and relevance"
    )
    required_documents: list[str]
    optional_but_helpful_documents: list[str]
    immediate_next_steps: list[str]
    important_caveats: list[str]



class FIRAnalysisResponse(BaseModel):
    extracted_fields: FIRExtractedFields
    masked_payload: MaskedFIRPayload
    legal_analysis: LegalAnalysis
    disclaimer: str = (
        "This analysis is AI-generated and informational only. "
        "It is NOT legal advice. Consult a qualified advocate before "
        "making any legal decisions."
    )