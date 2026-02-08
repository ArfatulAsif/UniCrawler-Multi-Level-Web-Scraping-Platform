import httpx
from playwright.async_api import async_playwright
from fake_useragent import UserAgent

class HybridFetcher:
    """
    A Smart Fetcher with STRICT Timeouts.
    If a page takes >5 seconds, we drop it and move on.
    """
    
    def __init__(self):
        self.ua = UserAgent()

    async def fetch(self, url: str):
        # Phase 1: Try Fast (HTTP)
        # Timeout is set to STRICT 5.0 seconds
        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=5.0) as client:
                headers = {"User-Agent": self.ua.random}
                response = await client.get(url, headers=headers)
                
                # Check for "Soft Block" or Empty React Shell
                if response.status_code == 200:
                    content_type = response.headers.get("content-type", "").lower()
                    
                    # If it's a PDF, return immediately (No need for browser)
                    if "application/pdf" in content_type:
                        return {"content": response.content, "type": "pdf", "url": str(response.url)}
                    
                    # If HTML is too small, it's likely a JS loading screen -> Switch to Browser
                    if len(response.text) > 2000 and "<div id=\"root\"></div>" not in response.text:
                        return {"content": response.content, "type": "html", "url": str(response.url)}
                        
                    print(f"[!] Site {url} requires JS rendering. Switching to Browser...")

        except httpx.TimeoutException:
            print(f"[x] HTTP Timeout (>5s): {url}")
            return None # Drop it immediately
        except Exception as e:
            print(f"[x] HTTP Failed: {e}. Switching to Browser...")

        # Phase 2: Power Mode (Headless Browser)
        return await self._fetch_with_browser(url)

    async def _fetch_with_browser(self, url: str):
        """
        Launches a real Chromium browser with a 5-second stopwatch.
        """
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(user_agent=self.ua.random)
            page = await context.new_page()

            try:
                # STRICT TIMEOUT: 5000ms (5 seconds)
                # We use 'domcontentloaded' instead of 'networkidle' because it is faster.
                await page.goto(url, wait_until="domcontentloaded", timeout=5000)
                
                # Fast Scroll (Trigger lazy loading)
                await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                # We don't wait long here, just enough for text to pop in
                await page.wait_for_timeout(500) 
                
                content = await page.content()
                final_url = page.url
                
                await browser.close()
                
                return {
                    "content": content.encode('utf-8'),
                    "type": "html",
                    "url": final_url
                }
            except Exception as e:
                # This catches the TimeoutError from Playwright
                print(f"[!] Browser Timeout or Failed (>5s) for {url}")
                await browser.close()
                return None