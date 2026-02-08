from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from datetime import datetime

# 1. INPUT SCHEMA
# This is what the user sends to POST /api/crawl
class CrawlRequest(BaseModel):
    url: str  # e.g. "https://www.cam.ac.uk"
    keywords: List[str]  # e.g. ["Scholarship", "PhD"]
    depth: Optional[int] = 2 # How deep to crawl (default 2 levels)

# 2. OUTPUT SCHEMA
# This is the shape of the data flowing through the WebSocket
class CrawlResult(BaseModel):
    url: str
    title: str
    snippet: str
    matched_keywords: List[str]
    score: float
    timestamp: str

# 3. STATUS SCHEMA
# Simple messages like "Job Started" or "Error"
class SystemMessage(BaseModel):
    type: str # "info", "error", "complete"
    message: str
    job_id: Optional[str] = None