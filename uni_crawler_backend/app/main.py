from fastapi import FastAPI
from app.api import routes, websocket
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow React to talk to Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router, prefix="/api")
app.include_router(websocket.router, prefix="/api")