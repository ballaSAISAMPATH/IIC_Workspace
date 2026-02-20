"""
Optional persistence layer.
Uses SQLite by default (switch to PostgreSQL via DATABASE_URL in .env).
"""

from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, DateTime, JSON
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class FIRRecord(Base):
    __tablename__ = "fir_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Raw (full-text stored only locally, never sent to cloud)
    raw_fir_text = Column(Text, nullable=False)

    # Extracted structured fields (JSON)
    extracted_fields = Column(JSON, nullable=True)

    # Masked payload that was forwarded to Gemini
    masked_payload = Column(JSON, nullable=True)

    # Gemini legal analysis output (JSON)
    legal_analysis = Column(JSON, nullable=True)

    # Masking token map (token → real value) — stored encrypted ideally
    token_map = Column(JSON, nullable=True)

    # Convenience fields
    fir_number = Column(String(64), nullable=True, index=True)
    police_station = Column(String(256), nullable=True)
    win_probability = Column(Integer, nullable=True)