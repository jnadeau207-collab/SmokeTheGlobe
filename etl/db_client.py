# etl/db_client.py
"""
Supabase database client and helpers for upsert + failed-parse logging.

Uses supabase-py and environment variables:
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY   (server key, NOT the anon key)
"""

from __future__ import annotations

import logging
import os
from typing import Iterable, Optional

from supabase import Client, create_client  # type: ignore

from .models import LicenseEntity, LLMParseError

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def _create_supabase_client() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment."
        )
    return create_client(url, key)


class SupabaseRepository:
    """
    Thin wrapper around supabase-py for license upserts and error logging.
    """

    def __init__(self, client: Optional[Client] = None) -> None:
        self.client: Client = client or _create_supabase_client()

    # -----------------------
    # License upsert
    # -----------------------

    def upsert_licenses(self, items: Iterable[LicenseEntity]) -> None:
        """
        Upsert a batch of LicenseEntity objects into the `licenses` table.

        The natural uniqueness constraint is (license_number, issuer),
        so the DB should have a UNIQUE index on that pair. We use
        on_conflict="license_number,issuer" accordingly.
        """
        payload = [item.to_db_dict() for item in items]
        if not payload:
            return

        logger.info("Upserting %d licenses", len(payload))

        response = (
            self.client.table("licenses")
            .upsert(payload, on_conflict="license_number,issuer")
            .execute()
        )
        if getattr(response, "error", None):
            raise RuntimeError(f"Supabase upsert error: {response.error}")

    # -----------------------
    # Failed parse logging
    # -----------------------

    def log_failed_parse(
        self,
        *,
        source: str,
        url: str,
        markdown: str,
        error: LLMParseError,
    ) -> None:
        """
        Persist a failed parse so we can re-process it later.

        Requires an `etl_failed_parses` table (create via migration) with fields:
          - id (uuid, default gen_random_uuid())
          - source (text)
          - url (text)
          - markdown (text)
          - error_message (text)
          - error_details (jsonb)
          - created_at (timestamp with time zone default now())
        """
        logger.warning("Logging failed parse for %s: %s", url, error)

        payload = {
            "source": source,
            "url": url,
            "markdown": markdown,
            "error_message": str(error),
            "error_details": error.as_dict(),
        }

        try:
            resp = (
                self.client.table("etl_failed_parses")
                .insert(payload)
                .execute()
            )
            if getattr(resp, "error", None):
                logger.error("Failed to log parse error to DB: %s", resp.error)
        except Exception as exc:  # In worst case, just log locally.
            logger.exception("Failed to log parse error to DB: %s", exc)
