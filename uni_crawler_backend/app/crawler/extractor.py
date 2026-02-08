import io
from selectolax.parser import HTMLParser
import pypdf

class UniversalExtractor:
    def extract(self, content: bytes, content_type: str, base_url: str):
        """
        Returns: (clean_text, list_of_links)
        """
        try:
            if content_type == 'html' or "text/html" in content_type:
                return self._extract_html(content, base_url)
            elif content_type == 'pdf' or "application/pdf" in content_type:
                return self._extract_pdf(content), []
            else:
                return "", []
        except Exception as e:
            print(f"Extractor Error: {e}")
            return "", []

    def _extract_html(self, html: bytes, base_url: str):
        # Selectolax is extremely fast
        tree = HTMLParser(html)
        
        # 1. Remove Noise (Nav, Footer, Ads, Scripts)
        # We perform css selection and remove those nodes from the tree
        for tag in tree.css("script, style, nav, footer, header, aside, .ad, .cookie, .banner"):
            tag.decompose()
            
        # 2. Extract Links
        links = set()
        for node in tree.css("a[href]"):
            href = node.attributes.get("href")
            if href and not href.startswith(("#", "javascript:", "mailto:", "tel:")):
                links.add(href)

        # 3. Extract Text (Weighting Headers)
        # We grab text specifically from content-heavy tags to avoid menu items
        text_parts = []
        
        # If the body is empty after stripping, just grab everything
        if not tree.body:
             return "", list(links)

        for node in tree.css("h1, h2, h3, h4, p, li, article, section"):
            # strip=True removes surrounding whitespace
            text = node.text(strip=True)
            if len(text) > 20: # Filter out tiny snippets like "Share" or "Date"
                text_parts.append(text)
            
        # Join with double newlines to preserve paragraph structure
        full_text = "\n\n".join(text_parts)
        
        return full_text, list(links)

    def _extract_pdf(self, content: bytes):
        try:
            reader = pypdf.PdfReader(io.BytesIO(content))
            text = []
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text.append(extracted)
            return "\n\n".join(text)
        except:
            return ""