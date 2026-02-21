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

    raw_fir_text = Column(Text, nullable=False)

    extracted_fields = Column(JSON, nullable=True)

    masked_payload = Column(JSON, nullable=True)

    legal_analysis = Column(JSON, nullable=True)

    token_map = Column(JSON, nullable=True)

    fir_number = Column(String(64), nullable=True, index=True)
    police_station = Column(String(256), nullable=True)
    win_probability = Column(Integer, nullable=True)