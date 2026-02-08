import re
from typing import List, Dict, Optional

class IntelligenceManager:
    """
    The Intelligence Manager (Ranking Engine).
    It splits a page into 'Blocks' (Paragraphs), scores them, 
    and returns the Top 3 most relevant blocks.
    """

    def __init__(self):
        # Configuration for "High End" Tuning
        self.MIN_SCORE_THRESHOLD = 10.0 # Ignore blocks with weak matches

    def process_page(self, url: str, title: str, text_content: str, keywords: List[str]) -> List[Dict]:
        """
        Main entry point. 
        Scans the page text, scores every paragraph, and returns the winners.
        """
        if not text_content:
            return []

        findings = []
        
        # 1. Split text into "Blocks" (Paragraphs)
        # We split by double newlines to get distinct sections of text
        blocks = text_content.split('\n\n')
        
        # 2. Iterate through every paragraph on the page
        for block in blocks:
            clean_block = block.strip()
            
            # Skip empty or tiny fragments (e.g. "Menu", "Copyright")
            if len(clean_block) < 40: 
                continue
                
            # 3. Score this block
            current_score = 0.0
            matched_keyword = None
            block_lower = clean_block.lower()
            
            for kw in keywords:
                kw_lower = kw.lower().strip()
                if not kw_lower: continue

                if kw_lower in block_lower:
                    # Base Score: 10 points per keyword match
                    current_score += 10.0
                    
                    # Context Bonus: 5 points if it's early in the paragraph (Headline style)
                    if block_lower.find(kw_lower) < 50:
                        current_score += 5.0
                    
                    # Density Bonus: 2 points for repeated mentions (capped at 5 times)
                    count = block_lower.count(kw_lower)
                    current_score += min(count, 5) * 2.0
                    
                    # Capture the first keyword found for the UI tag
                    if not matched_keyword:
                        matched_keyword = kw

            # 4. THRESHOLD CHECK
            if current_score >= self.MIN_SCORE_THRESHOLD:
                findings.append({
                    "keyword": matched_keyword,
                    "score": current_score,
                    # Truncate snippet to 200 chars for clean UI
                    "snippet": clean_block[:200] + ("..." if len(clean_block) > 200 else ""),
                    "url": url,
                    "title": title or "Untitled Page"
                })

        # 5. THE RANKING LOGIC
        # Sort by Score (Highest relevance first)
        findings.sort(key=lambda x: x['score'], reverse=True)

        # 6. THE LIMITER
        # Return only the Top 3 best paragraphs from this page
        return findings[:3]

# Singleton Instance to be imported
manager = IntelligenceManager()