# etl/scraper_agent.py
"""
Crawl4AI-based scraper agent for license sources.

Key method:
  - navigate_and_render(url) -> markdown string

Plus region-specific helpers:
  - scrape_california_pages(...)
  - fetch_washington_csv(...)
  - scrape_germany_club_leads(...)
"""

from __future__ import annotations

import asyncio
import logging
import os
import random
from typing import AsyncIterator, List, Optional

import httpx  # async HTTP client for CSV / file downloads
from crawl4ai import AsyncWebCrawler  # type: ignore
from crawl4ai.async_configs import (  # type: ignore
    BrowserConfig,
    CacheMode,
    CrawlerRunConfig,
)

logger = logging.getLogger(__name__)


DEFAULT_USER_AGENTS = [
    # Rotate user agents lightly to avoid basic anti-bot filters.
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0",
]


class LicenseScraper:
    """
    Manages a long-lived AsyncWebCrawler instance with sensible defaults.

    - Uses a random User-Agent per run to evade naive bot checks.
    - Respects a small random delay between requests.
    - Returns Markdown for robust LLM parsing instead of brittle HTML/XPath.
    """

    def __init__(
        self,
        *,
        user_agents: Optional[List[str]] = None,
        min_delay: float = 1.0,
        max_delay: float = 3.0,
    ) -> None:
        self.user_agents = user_agents or DEFAULT_USER_AGENTS
        self.min_delay = min_delay
        self.max_delay = max_delay

        ua = random.choice(self.user_agents)
        self.browser_config = BrowserConfig(
            # JS-enabled, headless Chromium by default.
            user_agent=ua,
            headless=True,
        )
        self._crawler: Optional[AsyncWebCrawler] = None

    async def __aenter__(self) -> "LicenseScraper":
        self._crawler = AsyncWebCrawler(config=self.browser_config)
        self._ctx = self._crawler.__aenter__()  # type: ignore[attr-defined]
        await self._ctx
        logger.info("LicenseScraper: AsyncWebCrawler started with UA=%s", self.browser_config.user_agent)
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        if self._crawler is not None:
            await self._crawler.__aexit__(exc_type, exc, tb)  # type: ignore[attr-defined]
            logger.info("LicenseScraper: AsyncWebCrawler closed")

    # ------------------------------------------------------------------
    # Core navigation
    # ------------------------------------------------------------------

    async def navigate_and_render(self, url: str) -> str:
        """
        Fetch a URL and return its Markdown content.

        Uses Crawl4AI's automatic HTML → Markdown conversion and processes
        dynamic pages (JS, infinite scroll, etc.) by letting the browser run.
        """
        assert self._crawler is not None, "Use LicenseScraper as an async context manager."

        await asyncio.sleep(random.uniform(self.min_delay, self.max_delay))

        run_cfg = CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,  # always fetch fresh license data
            word_count_threshold=10,
            process_iframes=True,
            remove_overlay_elements=True,
        )

        result = await self._crawler.arun(url=url, config=run_cfg)
        if not result.success:
            raise RuntimeError(f"Failed to crawl {url}: {result.error_message}")

        markdown = getattr(
            result.markdown,
            "raw_markdown",
            result.markdown,
        )
        return markdown

    # ------------------------------------------------------------------
    # Region-specific strategies
    # ------------------------------------------------------------------

    async def scrape_california_pages(
        self,
        *,
        search_url: Optional[str] = None,
        max_pages: int = 3,
    ) -> AsyncIterator[str]:
        """
        Yield Markdown for each page of CA license search results.
        """
        base = search_url or os.getenv(
            "CA_LICENSE_SEARCH_URL",
            "https://search.cannabis.ca.gov/",
        )

        for page in range(1, max_pages + 1):
            url = f"{base}?page={page}"
            logger.info("Scraping CA licenses page %d: %s", page, url)
            markdown = await self.navigate_and_render(url)
            yield markdown

    async def fetch_washington_csv(
        self,
        *,
        csv_url: Optional[str] = None,
    ) -> str:
        """
        Fetch WA license CSV/Excel as raw text.
        """
        url = csv_url or os.getenv(
            "WA_LICENSE_CSV_URL",
            "https://example.com/washington_licenses.csv",
        )
        logger.info("Downloading WA license CSV from %s", url)

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.text

    async def scrape_germany_club_leads(
        self,
        *,
        cities: Optional[List[str]] = None,
        search_base_url: Optional[str] = None,
    ) -> AsyncIterator[str]:
        """
        Heuristic discovery of German cannabis clubs.
        """
        cities = cities or ["Berlin", "Hamburg", "München", "Köln"]
        base = search_base_url or os.getenv(
            "DE_SEARCH_BASE_URL",
            "https://duckduckgo.com/html/?q=",
        )

        for city in cities:
            query = f"Anbauvereinigung {city}"
            url = f"{base}{query}"
            logger.info("Scraping DE club leads for %s: %s", city, url)
            markdown = await self.navigate_and_render(url)
            yield markdown
