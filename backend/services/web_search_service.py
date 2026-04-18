"""
DuckDuckGo Lite scraper + trafilatura content extractor.
No API key required. Used for Layer B web verification.
"""

import asyncio
import httpx
from bs4 import BeautifulSoup
from urllib.parse import quote_plus
import logging

logger = logging.getLogger(__name__)

DDG_LITE = "https://lite.duckduckgo.com/lite/"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; VerifiAI-Auditor/1.0)",
    "Accept": "text/html,application/xhtml+xml",
}


async def search_duckduckgo(query: str, max_results: int = 3) -> list[dict]:
    """Return top URLs + snippets from DuckDuckGo Lite."""
    results = []
    try:
        async with httpx.AsyncClient(timeout=8, headers=HEADERS, follow_redirects=True) as client:
            resp = await client.post(DDG_LITE, data={"q": query, "kl": "us-en"})
            soup = BeautifulSoup(resp.text, "html.parser")

            # DDG Lite: results are in <a class="result-link"> tags
            links = soup.find_all("a", class_="result-link")
            snippets = soup.find_all("td", class_="result-snippet")

            for i, link in enumerate(links[:max_results]):
                url = link.get("href", "")
                snippet = snippets[i].get_text(strip=True) if i < len(snippets) else ""
                if url and url.startswith("http"):
                    results.append({"url": url, "snippet": snippet[:300]})
    except Exception as e:
        logger.warning(f"DuckDuckGo search failed for '{query}': {e}")
    return results


async def extract_page_text(url: str, max_chars: int = 2000) -> str:
    """Fetch a URL and extract clean text using httpx + BeautifulSoup."""
    try:
        async with httpx.AsyncClient(timeout=6, headers=HEADERS, follow_redirects=True) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return ""
            soup = BeautifulSoup(resp.text, "html.parser")
            # Remove scripts, styles, nav, footer
            for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
                tag.decompose()
            text = soup.get_text(separator=" ", strip=True)
            return text[:max_chars]
    except Exception as e:
        logger.warning(f"Page extract failed for {url}: {e}")
        return ""


async def verify_claim_via_web(claim_text: str, search_query: str) -> dict:
    """
    Search web for a claim, extract top result text.
    Returns: {found: bool, source_url: str, evidence: str, raw_text: str}
    """
    results = await search_duckduckgo(search_query, max_results=2)
    if not results:
        return {"found": False, "source_url": "", "evidence": "", "raw_text": ""}

    top = results[0]
    # Try to get page text
    page_text = await extract_page_text(top["url"])
    if not page_text:
        page_text = top["snippet"]

    return {
        "found": True,
        "source_url": top["url"],
        "evidence": top["snippet"][:200],
        "raw_text": page_text,
    }


async def verify_claims_batch(
    claims: list[dict],
) -> dict[str, dict]:
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
