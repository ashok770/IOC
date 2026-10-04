from functools import lru_cache
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application configuration managed through environment variables.
    Defaults provide safe local execution defaults.
    """
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "OSINT Sentinel"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api"

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # PostgreSQL Database Configuration
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/osint_sentinel"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    DATABASE_POOL_PRE_PING: bool = True

    # Security & CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # Phase 11.5 Resource Controls
    MAX_CONCURRENT_OUTBOUND_REQUESTS: int = 10
    MAX_REQUESTS_PER_ASSESSMENT: int = 50
    COLLECTION_TIMEOUT_SECONDS: float = 10.0
    MAX_ACTIVE_COLLECTION_ASSETS: int = 20

    @property
    def cors_origins(self) -> List[str]:
        """Convert comma-delimited allowed origins to a clean list."""
        if not self.ALLOWED_ORIGINS:
            return []
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
