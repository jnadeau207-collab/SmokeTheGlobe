# etl/parser.py
"""
LLM-based "perception agent" that turns Markdown into structured LicenseEntity objects.

- No regex; we rely on an LLM with a strict JSON contract.
- Pydantic validation catches schema drift and malformed fields.
"""

from __future__ import annotations

import json
import logging
import os
from typing import List

from openai import OpenAI  # type: ignore

from .models import LLMParseError, LicenseEntity, ParsedLicenseBatch, LicenseIssuer

logger = logging.getLogger(__name__)


def _get_openai_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY must be set for LLM parsing.")
    return OpenAI(api_key=api_key)


def parse_with_llm(
    markdown_content: str,
    *,
    issuer: LicenseIssuer,
    region_hint: str,
) -> ParsedLicenseBatch:
    """
    Send Markdown to an LLM and parse it into a list of LicenseEntity.

    The prompt asks for:
      - strict JSON array
      - OpenTHC-style fields
      - null for missing values
      - addresses normalized to ISO-3166 (where possible)
    """
    client = _get_openai_client()
    model_name = os.getenv("LLM_MODEL", "gpt-4o-mini")

    system_prompt = (
        "You are a Compliance Data Parser. Extract cannabis license entities "
        "from the provided text and map fields to an OpenTHC-style license "
        "schema. Return ONLY a strict JSON array of objects, with no extra text. "
        "Fields per object:\n"
        "  - license_number (string)\n"
        "  - issuer (string; MUST be exactly one of 'CA-DCC', 'WA-LCB', 'DE-CLUB', 'TH-PLOOK')\n"
        "  - legal_name (string | null)\n"
        "  - dba_name (string | null)\n"
        "  - license_type (string | null)\n"
        "  - status (string | null)\n"
        "  - address_line1 (string | null)\n"
        "  - address_line2 (string | null)\n"
        "  - city (string | null)\n"
        "  - region (string | null)\n"
        "  - postal_code (string | null)\n"
        "  - country (string | null, ISO-3166 alpha-2 or alpha-3 if possible)\n"
        "  - region_config (object; key/value bag for extra region-specific fields)\n"
        "  - visibility (string; 'public' for regulator-sourced data, 'verified' if explicitly stated)\n"
        "Use null when a field is missing. Normalize addresses as much as possible."
    )

    user_prompt = (
        f"Region hint: {region_hint}\n"
        f"All extracted records should use issuer='{issuer}'.\n\n"
        "Text to parse (Markdown):\n"
        f"{markdown_content}"
    )

    logger.info("Calling LLM model=%s for issuer=%s", model_name, issuer)

    completion = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0,
    )

    raw = completion.choices[0].message.content or ""
    raw = raw.strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        logger.error("LLM returned non-JSON output: %s", e)
        raise LLMParseError(
            "LLM returned invalid JSON.",
            raw_response=raw,
            details=str(e),
        )

    if not isinstance(data, list):
        raise LLMParseError(
            "Expected a JSON array of license objects.",
            raw_response=raw,
        )

    licenses: List[LicenseEntity] = []
    for idx, item in enumerate(data):
        try:
            item.setdefault("issuer", issuer)
            item.setdefault("visibility", "public")
            licenses.append(LicenseEntity(**item))
        except Exception as e:
            raise LLMParseError(
                f"Pydantic validation failed for item index {idx}",
                raw_response=raw,
                details=str(e),
            ) from e

    return ParsedLicenseBatch(licenses=licenses, raw_json=raw)
