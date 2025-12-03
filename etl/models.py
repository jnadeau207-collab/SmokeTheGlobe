# etl/models.py
"""
Pydantic models and shared types for the ETL pipeline.

These mirror the `licenses` table schema from Phase 1 and use
OpenTHC-style field names (snake_case) so we can pass them straight
into Supabase/Postgres upserts.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


LicenseVisibility = Literal["public", "verified", "private"]
LicenseIssuer = Literal["CA-DCC", "WA-LCB", "DE-CLUB", "TH-PLOOK"]


class LicenseEntity(BaseModel):
    """
    Canonical license entity used by the ETL.

    Fields align with the `licenses` table in Postgres:
      - column names = snake_case
      - region_config is a JSONB bag for region-specific quirks
      - transparency_score is maintained later by ERP "Shadow Logic"
    """

    id: Optional[UUID] = Field(
        default=None,
        description="DB primary key; omitted on insert so Postgres can default.",
    )

    license_number: str
    issuer: LicenseIssuer
    visibility: LicenseVisibility = "public"

    legal_name: Optional[str] = None
    dba_name: Optional[str] = None
    license_type: Optional[str] = None
    status: Optional[str] = None

    owner_user_id: Optional[UUID] = Field(
        default=None,
        description="Supabase auth.users.id when the license owner links their account.",
    )

    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None

    region_config: Dict[str, Any] = Field(
        default_factory=dict,
        description="Region-specific fields from OpenTHC-like schemas.",
    )

    transparency_score: Decimal = Field(
        default=Decimal("0"),
        description="Aggregate metric; updated later by triggers.",
    )

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    def to_db_dict(self) -> Dict[str, Any]:
        """
        Convert to a dict suitable for Supabase upsert:
        - Drop `id` if None so Postgres can generate it.
        - Exclude read-only timestamps; they use DB defaults.
        - Exclude None values so DB defaults & RLS behave cleanly.
        """
        data = self.dict(
            exclude_none=True,
            exclude={"created_at", "updated_at"},
        )
        if data.get("id") is None:
            data.pop("id", None)
        return data


@dataclass
class ParsedLicenseBatch:
    """
    Small helper for returning parse results + context.

    `licenses` is the validated list.
    `raw_json` is the JSON we got from the LLM (for debugging/self-healing).
    """

    licenses: List[LicenseEntity]
    raw_json: str


class LLMParseError(Exception):
    """
    Raised when the LLM returns invalid JSON or data that fails Pydantic validation.
    """

    def __init__(
        self,
        message: str,
        *,
        raw_response: str,
        details: Optional[str] = None,
    ) -> None:
        super().__init__(message)
        self.raw_response = raw_response
        self.details = details or message

    def as_dict(self) -> Dict[str, Any]:
        return {
            "id": str(uuid4()),
            "message": str(self),
            "details": self.details,
            "raw_response": self.raw_response,
        }
