import asyncio
from typing import Set, Optional
from app.config.settings import get_settings

class AssessmentContext:
    def __init__(self, target_id: str):
        self.target_id = target_id
        self.requests_made = 0
        self.requested_destinations: Set[str] = set()

    def check_and_increment_budget(self) -> bool:
        settings = get_settings()
        if self.requests_made >= settings.MAX_REQUESTS_PER_ASSESSMENT:
            return False
        self.requests_made += 1
        return True

    def mark_destination_requested(self, destination: str) -> bool:
        if destination in self.requested_destinations:
            return False
        self.requested_destinations.add(destination)
        return True


class GlobalResourceController:
    _instance = None

    def __init__(self):
        self._outbound_semaphore: Optional[asyncio.Semaphore] = None
        self._target_locks: dict[str, asyncio.Lock] = {}
        self._lock = asyncio.Lock()

    @classmethod
    def get_instance(cls) -> "GlobalResourceController":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def get_semaphore(self) -> asyncio.Semaphore:
        if self._outbound_semaphore is None:
            settings = get_settings()
            self._outbound_semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_OUTBOUND_REQUESTS)
        return self._outbound_semaphore

    async def get_target_lock(self, target_id: str) -> asyncio.Lock:
        async with self._lock:
            if target_id not in self._target_locks:
                self._target_locks[target_id] = asyncio.Lock()
            return self._target_locks[target_id]
