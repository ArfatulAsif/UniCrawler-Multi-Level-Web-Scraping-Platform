import asyncio
import json
import os
import redis
from datetime import datetime
from celery import shared_task
from asgiref.sync import async_to_sync

from app.core.celery_app import celery_app
from app.crawler.fetcher import HybridFetcher
from app.crawler.extractor import UniversalExtractor
from app.crawler.manager import manager
from app.crawler.utils import URLUtils

# 1. SETUP
redis_client = redis.Redis.from_url(
    os.getenv("REDIS_URL", "redis://redis:6379/0"), 
    decode_responses=True
)

fetcher = HybridFetcher()
extractor = UniversalExtractor()

SKIP_EXTENSIONS = {
    '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', 
    '.zip', '.rar', '.tar', '.gz', 
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.mp4', '.mp3'
}

@celery_app.task(name="crawl_page_task")
def crawl_page_task(url: str, job_id: str, keywords: list, level: int):
    """
    BFS Crawler.
    level: How many more hops to go. 
    (3 = Start Page, 2 = Clicked Link, 1 = Clicked Link's Link, 0 = Stop)
    """
    
    # A. STOP CONDITION (BFS Limit)
    if level < 0:
        return

    # B. DEDUPLICATION
    if redis_client.sismember(f"visited:{job_id}", url):
        print(f"[{job_id}] SKIP: Already Visited -> {url}") 
        return
    redis_client.sadd(f"visited:{job_id}", url)

    # C. FILE CHECK
    if any(url.lower().endswith(ext) for ext in SKIP_EXTENSIONS):
        print(f"[{job_id}] SKIP: File Extension -> {url}")
        return

    print(f"[{job_id}] Crawling: {url} (Level: {level})")

    # HEARTBEAT
    redis_client.publish(f"job:{job_id}", json.dumps({
        "type": "progress",
        "url": url
    }))

    try:
        # D. FETCH
        raw_data = async_to_sync(fetcher.fetch)(url)
        
        if not raw_data or not raw_data.get('content'):
            return

        if raw_data.get('type') == 'pdf':
            return

        # E. EXTRACT
        text_content, links = extractor.extract(
            raw_data['content'], 
            raw_data.get('type', 'html'), 
            url
        )

        # F. RANKING & SCORING (The Update)
        page_title = raw_data.get('title', url) 
        
        # This now returns sorted TOP 3 results
        top_results = manager.process_page(
            url=url,
            title=page_title,
            text_content=text_content,
            keywords=keywords
        )

        # G. STREAMING RESULTS
        if top_results:
            for res in top_results:
                payload = {
                    "type": "result",
                    "url": res['url'],
                    "title": res['title'],
                    "snippet": res['snippet'],
                    "matched_keywords": [res['keyword']], 
                    "score": res['score'],
                    "timestamp": datetime.now().strftime("%H:%M:%S")
                }
                redis_client.publish(f"job:{job_id}", json.dumps(payload))
                print(f"[{job_id}] FOUND BEST MATCH: {res['score']}pts on {url}")

        # H. BFS RECURSION
        # If we still have levels remaining, keep going
        if level > 0:
            links_to_crawl = links[:15] # Breadth limit (width)
            
            for link in links_to_crawl:
                full_link = URLUtils.normalize_url(url, link)
                
                # Prevent self-loops (normalized link == current url)
                if full_link == url:
                    continue

                if URLUtils.is_same_domain(url, full_link):
                    # DECREMENT LEVEL: 3 -> 2 -> 1 -> 0
                    crawl_page_task.delay(full_link, job_id, keywords, level - 1)

    except Exception as e:
        print(f"[{job_id}] Error: {str(e)}")