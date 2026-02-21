"""
Static constants and prompt templates.
"""

IPC_DESCRIPTIONS: dict[str, str] = {
    "302": "Murder",
    "304": "Culpable homicide not amounting to murder",
    "307": "Attempt to murder",
    "320": "Grievous hurt",
    "323": "Voluntarily causing hurt",
    "354": "Assault on woman with intent to outrage modesty",
    "376": "Rape",
    "379": "Theft",
    "380": "Theft in dwelling house",
    "392": "Robbery",
    "395": "Dacoity",
    "406": "Criminal breach of trust",
    "420": "Cheating and dishonestly inducing delivery of property",
    "498A": "Husband or his relatives subjecting a woman to cruelty",
    "504": "Intentional insult to provoke breach of peace",
    "506": "Criminal intimidation",
    "509": "Word / gesture intended to insult the modesty of a woman",
    "120B": "Criminal conspiracy",
    "34": "Acts done by several persons in furtherance of common intention",
}

IPC_TO_CASE_NATURE: dict[str, str] = {
    "302": "Murder",
    "304": "Culpable Homicide",
    "307": "Attempt to Murder",
    "320": "Grievous Hurt",
    "323": "Assault / Hurt",
    "324": "Assault / Hurt",
    "325": "Assault / Hurt",
    "354": "Sexual Harassment",
    "376": "Sexual Offence / Rape",
    "379": "Theft",
    "380": "Theft",
    "381": "Theft",
    "384": "Extortion",
    "392": "Robbery",
    "395": "Dacoity",
    "406": "Criminal Breach of Trust",
    "420": "Fraud / Cheating",
    "498A": "Domestic Violence",
    "499": "Defamation",
    "504": "Public Nuisance / Intimidation",
    "506": "Criminal Intimidation",
    "509": "Sexual Harassment",
    "120B": "Criminal Conspiracy",
    "34": "Joint Criminal Act",
}

SENSITIVE_ENTITY_TYPES = [
    "person",
    "witness",
    "accused",
    "location",
    "phone",
    "aadhaar",
    "address",
    "vehicle",
]

CASE_DURATION_BENCHMARKS: dict[str, dict] = {
    "Fraud / Cheating": {"min": 24, "typical": 60, "max": 120},
    "Theft / Robbery":  {"min": 12, "typical": 36, "max": 84},
    "Assault":          {"min": 18, "typical": 48, "max": 96},
    "Murder":           {"min": 36, "typical": 96, "max": 180},
    "Cybercrime":       {"min": 18, "typical": 48, "max": 96},
    "Domestic Violence":{"min": 12, "typical": 30, "max": 72},
    "Sexual Offence":   {"min": 24, "typical": 60, "max": 120},
    "Default":          {"min": 18, "typical": 48, "max": 96},
}

EXTRACTION_SYSTEM_PROMPT = """You are a legal document parser specialising in Indian FIRs.
Extract information accurately. If a field is not present, return null.
Always respond in valid JSON only — no prose, no markdown fences."""

EXTRACTION_PROMPT_TEMPLATE = """Extract the following fields from this FIR text and return a JSON object.

JSON schema:
{{
  "fir_number": string | null,
  "police_station": string | null,
  "district": string | null,
  "date_of_filing": "YYYY-MM-DD" | null,
  "date_of_incident": "YYYY-MM-DD" | null,
  "time_of_incident": "HH:MM" | null,
  "victim_name": string | null,
  "victim_age": string | null,
  "victim_gender": "Male"|"Female"|"Other" | null,
  "victim_address": string | null,
  "victim_contact": string | null,
  "accused_names": [string],
  "witness_names": [string],
  "incident_location": string | null,
  "incident_description": string,
  "ipc_sections": [string],
  "other_acts": [string],
  "case_nature": string | null,
  "entities_for_masking": {{
    "person": [string],
    "accused": [string],
    "witness": [string],
    "location": [string],
    "phone": [string],
    "aadhaar": [string],
    "address": [string],
    "vehicle": [string]
  }}
}}

FIR TEXT:
{fir_text}
"""

LEGAL_ANALYSIS_PROMPT_TEMPLATE = """You are an expert Indian criminal lawyer and legal analyst with deep knowledge of Indian court judgements.
You will be given details of an FIR (First Information Report) with personal details masked for privacy.
Analyse the case objectively and respond ONLY with a valid JSON object matching the schema below.
Today's date is {today}.

IMPORTANT CONTEXT (Indian Judiciary):
- District courts average 3-5 years for criminal trials.
- High courts add 2-5 years for appeals.
- Pendency in India is very high — factor this into duration estimates.
- Advocate fees vary from ₹5,000–₹50,000/hearing depending on city and seniority.

FIR DETAILS (PII masked):
Incident date      : {date_of_incident}
Location/District  : {police_station_district}
Case nature        : {case_nature}
IPC Sections       : {ipc_sections}
Other Acts         : {other_acts}

Incident description (masked):
{masked_description}

Respond with this exact JSON schema — no extra keys, no prose:
{{
  "estimated_duration_months": {{
    "district_court_min": int,
    "district_court_typical": int,
    "district_court_max": int,
    "including_appeals_typical": int,
    "notes": string
  }},
  "cost_estimate_inr": {{
    "advocate_fees_min": int,
    "advocate_fees_max": int,
    "court_fees_approx": int,
    "miscellaneous_min": int,
    "miscellaneous_max": int,
    "total_min": int,
    "total_max": int,
    "notes": string
  }},
  "win_probability_percent": int (0-100),
  "win_probability_reasoning": string (3-5 sentences — mention relevant past cases if you know any),
  "key_strengths": [string (at least 2)],
  "key_weaknesses": [string],
  "recommended_action": "Proceed to Trial" | "Negotiate Settlement" | "Mediation / Lok Adalat" | "Drop the Case",
  "recommended_action_reasoning": string,
  "similar_past_cases": [
    {{
      "case_title": string (e.g. "State of Maharashtra vs Vijay Salaskar 2010"),
      "court": string (e.g. "Supreme Court of India" or "Bombay High Court"),
      "year": int,
      "ipc_sections": [string],
      "what_happened": string (2-3 sentences describing the facts of that case),
      "judgement_summary": string (2-3 sentences on what the court decided and why),
      "outcome": "Convicted" | "Acquitted" | "Settled" | "Compounded" | "Partially Convicted",
      "sentence_or_relief": string (e.g. "3 years RI and fine of Rs 10,000"),
      "relevance_to_current_case": string (1-2 sentences on why this case is relevant here)
    }}
  ],
  "required_documents": [string],
  "optional_but_helpful_documents": [string],
  "immediate_next_steps": [string (ordered list of 4-6 steps victim should take NOW)],
  "important_caveats": [string]
}}

For similar_past_cases:
- Include 2 to 4 real Indian court cases that closely match the current IPC sections and facts.
- Prefer Supreme Court and High Court judgements as they carry more precedent value.
- If you know the exact citation (AIR, SCC, Cr.LJ), include it in case_title.
- Only include cases you are confident about — do not fabricate case names or citations.
- If no closely matching cases come to mind, return an empty array [].
"""