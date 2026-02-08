import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CONCURRENCY = int(os.getenv("CONCURRENCY", 5))

settings = Settings()