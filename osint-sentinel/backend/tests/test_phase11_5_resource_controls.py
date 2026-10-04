import pytest
import asyncio
from unittest.mock import patch, MagicMock

from collectors.http.header_collector import HTTPHeaderCollector
from app.utils.resource_controls import AssessmentContext, GlobalResourceController

def test_global_concurrency_limit_respected():
    # Setup controller with limit 1
    controller = GlobalResourceController.get_instance()
    controller._outbound_semaphore = asyncio.Semaphore(1)
    
    collector = HTTPHeaderCollector(timeout=1.0)
    
    from unittest.mock import AsyncMock
    with patch("httpx.AsyncClient.stream") as mock_stream:
        # Mock stream to hang briefly to test concurrency
        mock_cm = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {}
        
        async def aiter_text_mock():
            yield ""
            
        mock_response.aiter_text = aiter_text_mock
        
        async def mock_stream_aenter(self):
            await asyncio.sleep(0.1)
            return mock_response
            
        mock_cm.__aenter__ = mock_stream_aenter
        mock_stream.return_value = mock_cm
        
        async def run_test():
            start_time = asyncio.get_event_loop().time()
            
            # Launch two requests
            tasks = [
                collector.collect("example.com"),
                collector.collect("example.org"),
            ]
            
            await asyncio.gather(*tasks)
            
            end_time = asyncio.get_event_loop().time()
            
            # Because limit is 1, they should run sequentially and take at least 0.2s total
            assert end_time - start_time >= 0.2
            
        asyncio.run(run_test())

def test_request_budget_stops_additional_work():
    controller = GlobalResourceController.get_instance()
    controller._outbound_semaphore = asyncio.Semaphore(10)
    
    context = AssessmentContext(target_id="tgt_123")
    context.requests_made = 50 # Max limit
    
    collector = HTTPHeaderCollector(timeout=1.0)
    
    report = asyncio.run(collector.collect("example.com", context=context))
    
    assert report.status == "no_data"
    assert "budget exhausted" in report.error_message

def test_duplicate_requests_suppressed():
    controller = GlobalResourceController.get_instance()
    controller._outbound_semaphore = asyncio.Semaphore(10)
    
    context = AssessmentContext(target_id="tgt_123")
    
    collector = HTTPHeaderCollector(timeout=1.0)
    
    from unittest.mock import AsyncMock
    with patch("httpx.AsyncClient.stream") as mock_stream:
        mock_cm = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {}
        
        async def aiter_text_mock():
            yield ""
            
        mock_response.aiter_text = aiter_text_mock
        
        async def mock_stream_aenter(self):
            return mock_response
            
        mock_cm.__aenter__ = mock_stream_aenter
        mock_stream.return_value = mock_cm
        
        async def run_test():
            report1 = await collector.collect("example.com", context=context)
            report2 = await collector.collect("example.com", context=context)
            return report1, report2
            
        report1, report2 = asyncio.run(run_test())
        
        assert report1.status == "success"
        assert report2.status == "no_data"
        assert "duplicate request" in report2.error_message

def test_different_targets_can_collect_concurrently():
    controller = GlobalResourceController.get_instance()
    
    async def run_test():
        lock1 = await controller.get_target_lock("tgt_A")
        lock2 = await controller.get_target_lock("tgt_B")
        return lock1, lock2
        
    lock1, lock2 = asyncio.run(run_test())
    assert lock1 is not lock2
