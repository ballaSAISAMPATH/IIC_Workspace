"""
Utility functions for FIR analysis.
"""

import re
from fir_analysis.constants import IPC_DESCRIPTIONS, IPC_TO_CASE_NATURE


def normalise_sections(sections: list[str]) -> list[str]:
    """
    Standardise IPC section strings.
    e.g. "Section 420 IPC" → "IPC 420"
         "u/s 302"         → "IPC 302"
    """
    normalised = []
    for s in sections:
        s = s.strip()
        matches = re.findall(r"\d+[A-Za-z-]*", s)
        for m in matches:
            m = m.upper().replace("-", "")
            label = f"IPC {m}"
            if label not in normalised:
                normalised.append(label)
    return normalised


def describe_sections(sections: list[str]) -> dict[str, str]:
    """Return a dict of section → human-readable description."""
    result = {}
    for sec in sections:
        m = re.search(r"(\d+[A-Za-z]*)", sec)
        if m:
            key = m.group(1).upper()
            result[sec] = IPC_DESCRIPTIONS.get(key, "Refer to IPC / Special Act")
    return result


def infer_case_nature(
    case_nature: str | None,
    ipc_sections: list[str],
    other_acts: list[str],
) -> str:
    """
    If the model returned null for case_nature, infer it from IPC sections.
    Falls back to 'General Criminal' if nothing matches.
    """
    if case_nature:
        return case_nature

    for section in ipc_sections:
        m = re.search(r"(\d+[A-Za-z]*)", section)
        if m:
            key = m.group(1).upper()
            if key in IPC_TO_CASE_NATURE:
                return IPC_TO_CASE_NATURE[key]

    combined = " ".join(other_acts).lower()
    if "it act" in combined or "cyber" in combined:
        return "Cybercrime"
    if "ndps" in combined or "narcotic" in combined:
        return "Narcotics"
    if "pocso" in combined:
        return "Sexual Offence Against Minor"
    if "sc/st" in combined:
        return "Atrocity / SC-ST Act"

    return "General Criminal"


def estimate_page_count(text: str) -> int:
    """Rough estimate: ~300 words per page."""
    words = len(text.split())
    return max(1, words // 300)


def redact_for_log(text: str, keep_chars: int = 80) -> str:
    """Truncate FIR text for safe logging (avoid PII in logs)."""
    return text[:keep_chars].replace("\n", " ") + "…"