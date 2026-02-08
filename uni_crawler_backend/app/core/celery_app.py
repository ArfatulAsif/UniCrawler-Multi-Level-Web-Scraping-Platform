from celery import Celery
from .config import settings

celery_app = Celery(
    "crawler",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.worker"]
)