from urllib.parse import urlparse, urljoin

class URLUtils:
    @staticmethod
    def get_domain(url: str) -> str:
        """
        Extracts 'harvard.edu' from 'https://www.cs.harvard.edu/news'
        """
        try:
            parsed = urlparse(url)
            return parsed.netloc
        except:
            return ""

    @staticmethod
    def is_same_domain(source_url: str, target_url: str) -> bool:
        """
        The Gatekeeper.
        Returns True ONLY if target_url belongs to the same university as source_url.
        """
        source_domain = URLUtils.get_domain(source_url).replace("www.", "")
        target_domain = URLUtils.get_domain(target_url).replace("www.", "")

        # 1. Exact Match
        if source_domain == target_domain:
            return True

        # 2. Subdomain Match (e.g. cs.harvard.edu inside harvard.edu)
        if target_domain.endswith("." + source_domain):
            return True
        
        # 3. Reverse Subdomain (Scanning cs.harvard.edu, found link to harvard.edu)
        if source_domain.endswith("." + target_domain):
            return True

        return False

    @staticmethod
    def normalize_url(base_url: str, link: str) -> str:
        """
        Converts relative links into absolute links.
        CRITICAL FIX: Strips query params (?) and fragments (#) to prevent infinite loops.
        """
        # 1. Join relative paths
        full_url = urljoin(base_url, link)
        
        # 2. Parse and Strip
        parsed = urlparse(full_url)
        
        # Rebuild keeping only Scheme + Netloc + Path (Drop query & fragment)
        clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
        
        # 3. Remove trailing slash to prevent duplicates (page/ vs page)
        if clean_url.endswith("/"):
            clean_url = clean_url[:-1]
            
        return clean_url