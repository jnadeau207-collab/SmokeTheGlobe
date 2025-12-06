# etl/etl_pipeline.py
"""
Top-level ETL orchestrator.

- Creates a LicenseScraper (Crawl4AI).
- Scrapes region-specific sources (CA, WA, DE).
- Uses parse_with_llm() for unstructured sources.
- For WA CSV, either map directly or round-trip via the LLM for normalization.
- Upserts results into Supabase.
- Logs failed parses into `etl_failed_parses` for self-healing.

Run with:
    python -m etl.etl_pipeline
"""

from __future__ import annotations

import asyncio
import csv
import logging
import os
from io import StringIO
from typing import List

from .db_client import SupabaseRepository
from .models import LLMParseError, LicenseEntity
from etl.jobs.sync_us_licenses import run_us_license_etl
from .parser import parse_with_llm
from .scraper_agent import LicenseScraper

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


async def etl_california(repo: SupabaseRepository, scraper: LicenseScraper) -> None:
    """
    Scrape CA license portal pages and upsert them.
    """
    all_licenses: List[LicenseEntity] = []

    async for markdown in scraper.scrape_california_pages():
        try:
            parsed = parse_with_llm(
                markdown,
                issuer="CA-DCC",
                region_hint="California, United States",
            )
            all_licenses.extend(parsed.licenses)
        except LLMParseError as err:
            repo.log_failed_parse(
                source="CA",
                url="CA_SEARCH_PAGE",
                markdown=markdown,
                error=err,
            )

    if all_licenses:
        repo.upsert_licenses(all_licenses)


async def etl_washington(repo: SupabaseRepository, scraper: LicenseScraper) -> None:
    """
    Fetch WA LCB CSV/Excel data, normalize, and upsert.
    """
    csv_text = await scraper.fetch_washington_csv()
    f = StringIO(csv_text)
    reader = csv.DictReader(f)

    licenses: List[LicenseEntity] = []

    for row in reader:
        license_number = row.get("LicenseNumber") or row.get("license_number")
        if not license_number:
            continue

        try:
            lic = LicenseEntity(
                license_number=license_number,
                issuer="WA-LCB",
                visibility="public",
                legal_name=row.get("BusinessName") or row.get("name"),
                dba_name=row.get("DBAName") or row.get("dba_name"),
                license_type=row.get("LicenseType") or row.get("license_type"),
                status=row.get("LicenseStatus") or row.get("status"),
                address_line1=row.get("Address1") or row.get("StreetAddress"),
                address_line2=row.get("Address2"),
                city=row.get("City"),
                region=row.get("State") or "WA",
                postal_code=row.get("ZipCode"),
                country="US",
                region_config={
                    "county": row.get("County"),
                    "premise_type": row.get("PremiseType"),
                },
            )
            licenses.append(lic)
        except Exception as e:
            markdown = f"WA License Row:\n```csv\n{row}\n```"
            try:
                parsed = parse_with_llm(
                    markdown,
                    issuer="WA-LCB",
                    region_hint="Washington State, United States",
                )
                licenses.extend(parsed.licenses)
            except LLMParseError as err:
                repo.log_failed_parse(
                    source="WA",
                    url="WA_CSV_ROW",
                    markdown=markdown,
                    error=err,
                )
                logger.warning("Failed to parse WA row: %s; error=%s", row, e)

    if licenses:
        repo.upsert_licenses(licenses)


async def etl_germany(repo: SupabaseRepository, scraper: LicenseScraper) -> None:
    """
    Heuristic scraping for German clubs; mark them as unverified leads.
    """
    all_licenses: List[LicenseEntity] = []

    async for markdown in scraper.scrape_germany_club_leads():
        try:
            parsed = parse_with_llm(
                markdown,
                issuer="DE-CLUB",
                region_hint="Germany; cannabis social clubs / Anbauvereinigung",
            )
            for lic in parsed.licenses:
                lic.region_config.setdefault("verification_status", "unverified_lead")
            all_licenses.extend(parsed.licenses)
        except LLMParseError as err:
            repo.log_failed_parse(
                source="DE",
                url="DE_SEARCH_RESULT",
                markdown=markdown,
                error=err,
            )

    if all_licenses:
        repo.upsert_licenses(all_licenses)


async def reprocess_failed_parses(repo: SupabaseRepository) -> None:
    """
    Stub for self-healing logic. Implement reprocessing as needed.
    """
    logger.info("Self-healing reprocess_failed_parses() is a stub for now.")


async def main() -> None:
    """
    Run ETL for all configured regions once.
    """
    repo = SupabaseRepository()
    async with LicenseScraper() as scraper:
        tasks = []

        if os.getenv("ETL_ENABLE_CA", "1") == "1":
            tasks.append(etl_california(repo, scraper))
        if os.getenv("ETL_ENABLE_WA", "1") == "1":
            tasks.append(etl_washington(repo, scraper))
        if os.getenv("ETL_ENABLE_DE", "1") == "1":
            tasks.append(etl_germany(repo, scraper))

        await asyncio.gather(*tasks)

        if os.getenv("ETL_ENABLE_SELF_HEALING", "1") == "1":
            await reprocess_failed_parses(repo)


if __name__ == "__main__":
    asyncio.run(main())
