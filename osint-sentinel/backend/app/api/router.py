from fastapi import APIRouter
from app.api.v1 import health, targets

api_router = APIRouter()

# Health probe mounted at /api/health
api_router.include_router(health.router)

# Targets & Domain OSINT mounted at /api/v1/targets
api_router.include_router(targets.router)
