# etl/jobs/sync_us_licenses.py
"""
US license ETL job.

- Reads etl/sources_us.yml
- For each enabled license source:
    - Fetches JSON/CSV from the endpoint
    - Maps fields into LicenseRecord
    - Upserts into Postgres via PgRepo
"""

from __future__ import annotations

import csv
import io
import json
import logging
import os
from typing import Any, Dict, List

import requests
import yaml

from etl.db_client_pg import LicenseRecord, PgRepo

logger = logging.getLogger(__name__)


def _load_sources(config_path: str) -> List[Dict[str, Any]]:
  with open(config_path, "r", encoding="utf-8") as f:
    data = yaml.safe_load(f) or []
  return [s for s in data if s.get("enabled") and s.get("kind") == "license"]


def _fetch_data(source: Dict[str, Any]) -> List[Dict[str, Any]]:
  endpoint = source["endpoint"]
  source_type = source.get("source_type", "open_data_api")

  # NOTE: We only support simple HTTP GET to open-data endpoints here.
  # Do NOT use this to hit sites that disallow scraping in robots.txt
  # or terms of service.
  headers = {
    "User-Agent": "SmokeTheGlobe-ETL/1.0 (+for-public-regulatory-data)",
  }

  resp = requests.get(endpoint, headers=headers, timeout=30)
  resp.raise_for_status()

  if source_type in ("open_data_api", "json"):
    payload = resp.json()
    if isinstance(payload, dict):
      # Some APIs nest under e.g. 'results'
      payload = payload.get("results", [])
    return payload

  if source_type == "csv":
    text = resp.text
    reader = csv.DictReader(io.StringIO(text))
    return list(reader)

  raise ValueError(f"Unsupported source_type: {source_type}")


def _map_row_to_license(source: Dict[str, Any], row: Dict[str, Any]) -> LicenseRecord:
  fm = source["field_mapping"]
  def get(field: str, default=None):
    src_field = fm.get(field)
    return row.get(src_field, default) if src_field else default

  return LicenseRecord(
    state_code=str(get("state_code") or source["jurisdiction"].split("-")[-1]),
    license_number=str(get("license_number") or ""),
    license_type=str(get("license_type") or "unknown"),
    status=str(get("status") or "unknown"),
    entity_name=str(get("entity_name") or "").strip() or "Unknown entity",
    country_code="US",
    region_code=source["jurisdiction"].split("-")[-1],
    city=(get("city") or "") or None,
    issued_at=get("issued_at"),
    expires_at=get("expires_at"),
    source_url=source.get("endpoint"),
    source_system=source.get("source_system"),
    raw_data=row,
  )


def run_us_license_etl(config_path: str = "etl/sources_us.yml") -> None:
  repo = PgRepo()
  sources = _load_sources(config_path)
  if not sources:
    logger.info("No enabled US license sources; nothing to do.")
    return

  for src in sources:
    logger.info("Running license ETL for source %s", src["id"])
    rows = _fetch_data(src)
    records = [_map_row_to_license(src, r) for r in rows]
    repo.upsert_state_licenses(records)
    logger.info("Completed %s (%d rows)", src["id"], len(records))
