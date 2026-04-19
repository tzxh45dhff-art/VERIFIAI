"""
VerifAI — Web search + content extraction for Layer B verification.
Uses DuckDuckGo Lite (no API key) + trafilatura for text extraction.
"""
import asyncio
import urllib.parse
import httpx
from bs4 import BeautifulSoup
from loguru import logger

try:
    import trafilatura
except ImportError:
    trafilatura = None
    logger.warning("trafilatura not installed — web extraction degraded")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; VerifAI-Auditor/1.0)",
    "Accept": "text/html,application/xhtml+xml",
}


async def search_duckduckgo(query: str, max_results: int = 3) -> list[str]:
    """Return top URLs from DuckDuckGo Lite."""
    encoded = urllib.parse.quote(query)
    url = f"https://lite.duckduckgo.com/lite/?q={encoded}"

    try:
        async with httpx.AsyncClient(timeout=10.0, headers=HEADERS, follow_redirects=True) as client:
            resp = await client.get(url)
            soup = BeautifulSoup(resp.text, "lxml")

            links = []
            skip_domains = ["youtube.com", "twitter.com", "facebook.com",
                            "instagram.com", "reddit.com", "duckduckgo.com"]

            for a in soup.find_all("a", href=True):
                href = a["href"]
                if href.startswith("http") and not any(s in href for s in skip_domains):
                    links.append(href)
                if len(links) >= max_results:
                    break

            return links
    except Exception as e:
        logger.warning(f"DuckDuckGo search failed for '{query}': {e}")
        return []


async def extract_page_text(url: str, max_chars: int = 2000) -> str:
    """Fetch a URL and extract clean text."""
    try:
        async with httpx.AsyncClient(timeout=8.0, headers=HEADERS, follow_redirects=True) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return ""

            # Try trafilatura first (better extraction)
            if trafilatura:
                text = trafilatura.extract(
                    resp.text,
                    include_comments=False,
                    include_tables=False,
                    no_fallback=False,
                )
                if text:
                    return text[:max_chars]

            # Fallback to BeautifulSoup
            soup = BeautifulSoup(resp.text, "lxml")
            for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
                tag.decompose()
            text = soup.get_text(separator=" ", strip=True)
            return text[:max_chars]
    except Exception as e:
        logger.warning(f"Page extract failed for {url}: {e}")
        return ""


async def verify_claim_via_web(claim_text: str, search_query: str) -> dict:
    """Search web for a claim and return extracted evidence."""
    urls = await search_duckduckgo(search_query, max_results=2)
    if not urls:
        return {"found": False, "source_url": "", "evidence": "", "raw_text": ""}

    contents = []
    for url in urls[:2]:
        text = await extract_page_text(url)
        if text:
            contents.append({"url": url, "text": text})

    if not contents:
        return {"found": False, "source_url": "", "evidence": "", "raw_text": ""}

    return {
        "found": True,
        "source_url": contents[0]["url"],
        "evidence": contents[0]["text"][:200],
        "raw_text": contents[0]["text"],
        "all_sources": contents,
    }


async def verify_claims_batch(claims: list[dict]) -> dict[str, dict]:
    """Run web verification for multiple claims concurrently."""
    tasks = {}
    for claim in claims:
        sq = claim.get("search_query")
        if sq:
            tasks[claim["id"]] = verify_claim_via_web(claim["text"], sq)

    if not tasks:
        return {}

    results_list = await asyncio.gather(*tasks.values(), return_exceptions=True)
    return {
        cid: (r if not isinstance(r, Exception) else {"found": False, "source_url": "", "evidence": "", "raw_text": ""})
        for cid, r in zip(tasks.keys(), results_list)
    }
