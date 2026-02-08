from fastapi import APIRouter
from app.schemas.messages import CrawlRequest
from app.tasks.worker import crawl_page_task
import uuid

router = APIRouter()

@router.post("/crawl")
async def start_crawl(req: CrawlRequest):
    job_id = str(uuid.uuid4())
    
    # Use 'level' (from frontend depth/level input) or default to 2
    # NOTE: In schema it might still be called 'depth', we just map it here.
    start_level = req.depth if req.depth else 2
    
    # Start the crawl with Level logic
    crawl_page_task.delay(req.url, job_id, req.keywords, level=start_level)
    
    return {"job_id": job_id, "status": "started"}