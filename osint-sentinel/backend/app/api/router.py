from fastapi import APIRouter
from app.api.v1 import health

api_router = APIRouter()

# Health probe mounted at /health (which will be /api/health under main router)
api_router.include_router(health.router)
