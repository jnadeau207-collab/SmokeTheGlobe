# etl/db_client_pg.py
"""
Postgres database client for ETL.

Replaces the old Supabase-focused db_client with direct writes into
the SmokeTheGlobe Postgres schema used by Prisma.

Uses:
  - DATABASE_URL   (same as your Next.js app)

IMPORTANT: This module is designed to respect legal & compliance
constraints. You are responsible for ensuring that any ETL job that
calls into it only uses data sources you are allowed to ingest.
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from typing import Iterable, Optional

import psycopg2
from psycopg2.extras import execute_batch

logger = logging.getLogger(__name__)


@dataclass
class LicenseRecord:
  state_code: str
  license_number: str
  license_type: str
  status: str
  entity_name: str
  country_code: str = "US"
  region_code: Optional[str] = None
  city: Optional[str] = None
  latitude: Optional[float] = None
  longitude: Optional[float] = None
  issued_at: Optional[str] = None  # ISO strings; DB will cast
  expires_at: Optional[str] = None
  source_url: Optional[str] = None
  source_system: Optional[str] = None
  raw_data: Optional[dict] = None


class PgRepo:
  """
  Thin Postgres client that knows how to upsert into Prisma tables.

  It assumes the Prisma migrations defined these tables:

    - "StateLicense"
    - (later) "Batch", "CoaDocument", "LabResult", etc.
  """

  def __init__(self, conn_str: Optional[str] = None) -> None:
    self.conn_str = conn_str or os.environ.get("DATABASE_URL")
    if not self.conn_str:
      raise RuntimeError("DATABASE_URL env var is required for ETL PgRepo")

  def _conn(self):
    return psycopg2.connect(self.conn_str)

  # -----------------------
  # License upsert
  # -----------------------

  def upsert_state_licenses(self, records: Iterable[LicenseRecord]) -> int:
    """
    Upsert a batch of StateLicense rows.

    Unique key: (stateCode, licenseNumber)

    WARNING: This function assumes the Prisma migration has created
    columns:
      - stateCode, licenseNumber, licenseType, status, entityName
      - countryCode, regionCode, city, latitude, longitude
      - issuedAt, expiresAt, sourceUrl, sourceSystem, rawData
    """
    items = list(records)
    if not items:
      return 0

    with self._conn() as conn, conn.cursor() as cur:
      execute_batch(
        cur,
        """
        INSERT INTO "StateLicense" (
          "stateCode",
          "licenseNumber",
          "licenseType",
          "status",
          "entityName",
          "countryCode",
          "regionCode",
          "city",
          "latitude",
          "longitude",
          "issuedAt",
          "expiresAt",
          "sourceUrl",
          "sourceSystem",
          "rawData"
        )
        VALUES (
          %(state_code)s,
          %(license_number)s,
          %(license_type)s,
          %(status)s,
          %(entity_name)s,
          %(country_code)s,
          %(region_code)s,
          %(city)s,
          %(latitude)s,
          %(longitude)s,
          %(issued_at)s,
          %(expires_at)s,
          %(source_url)s,
          %(source_system)s,
          %(raw_data)s
        )
        ON CONFLICT ("stateCode", "licenseNumber") DO UPDATE SET
          "licenseType"   = EXCLUDED."licenseType",
          "status"        = EXCLUDED."status",
          "entityName"    = EXCLUDED."entityName",
          "countryCode"   = EXCLUDED."countryCode",
          "regionCode"    = EXCLUDED."regionCode",
          "city"          = EXCLUDED."city",
          "latitude"      = EXCLUDED."latitude",
          "longitude"     = EXCLUDED."longitude",
          "issuedAt"      = EXCLUDED."issuedAt",
          "expiresAt"     = EXCLUDED."expiresAt",
          "sourceUrl"     = EXCLUDED."sourceUrl",
          "sourceSystem"  = EXCLUDED."sourceSystem",
          "rawData"       = EXCLUDED."rawData";
        """,
        [
          {
            "state_code": r.state_code,
            "license_number": r.license_number,
            "license_type": r.license_type,
            "status": r.status,
            "entity_name": r.entity_name,
            "country_code": r.country_code,
            "region_code": r.region_code,
            "city": r.city,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "issued_at": r.issued_at,
            "expires_at": r.expires_at,
            "source_url": r.source_url,
            "source_system": r.source_system,
            "raw_data": r.raw_data,
          }
          for r in items
        ],
      )

    logger.info("Upserted %d state licenses", len(items))
    return len(items)
