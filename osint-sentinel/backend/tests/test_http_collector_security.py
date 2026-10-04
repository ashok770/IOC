import pytest
import asyncio
import socket
from unittest.mock import patch
import httpx
import httpcore
from collectors.http.header_collector import HTTPHeaderCollector

class MockStream(httpcore.AsyncNetworkStream):
    def __init__(self, response_chunks):
        self.chunks = response_chunks
        self.index = 0

    async def read(self, max_bytes: int, timeout: float = None) -> bytes:
        if self.index < len(self.chunks):
            chunk = self.chunks[self.index]
            self.index += 1
            return chunk
        return b""

    async def write(self, buffer: bytes, timeout: float = None) -> None:
        pass

    async def aclose(self) -> None:
        pass

    async def start_tls(self, *args, **kwargs) -> httpcore.AsyncNetworkStream:
        return self

    def get_extra_info(self, info: str):
        return None

DNS_MOCK = {
    "public.com": ["93.184.216.34"],
    "localhost": ["127.0.0.1"],
    "private.com": ["10.0.0.1"],
    "aws-metadata": ["169.254.169.254"],
    "ipv6-local": ["::1"],
    "ipv6-private": ["fc00::1"],
    "rebind.com": ["93.184.216.34"],
    "redirect-chain.com": ["8.8.8.8"],
    "redirect-target.com": ["8.8.4.4"],
    "redirect-private.com": ["9.9.9.9"],
    "large-response.com": ["8.8.8.8"],
}

async def mock_getaddrinfo(self, host, port, *args, **kwargs):
    import ipaddress
    try:
        ipaddress.ip_address(host)
        if ":" in host:
            return [(socket.AF_INET6, socket.SOCK_STREAM, 6, "", (host, port))]
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (host, port))]
    except ValueError:
        pass
        
    if host in DNS_MOCK:
        ips = DNS_MOCK[host]
        results = []
        for ip in ips:
            if ":" in ip:
                results.append((socket.AF_INET6, socket.SOCK_STREAM, 6, "", (ip, port)))
            else:
                results.append((socket.AF_INET, socket.SOCK_STREAM, 6, "", (ip, port)))
        return results
    raise socket.gaierror(socket.EAI_NONAME, f"Name or service not known: {host}")

@pytest.fixture
def mock_dns():
    with patch("asyncio.base_events.BaseEventLoop.getaddrinfo", new=mock_getaddrinfo):
        yield

@pytest.fixture
def mock_tcp():
    async def mock_connect_tcp(self, host, port, **kwargs):
        if host == "93.184.216.34":
            return MockStream([
                b"HTTP/1.1 200 OK\r\n",
                b"Content-Type: text/html\r\n",
                b"Server: TestServer\r\n\r\n",
                b"<html><head><meta name=\"generator\" content=\"TestGen\"></head><body>Safe</body></html>"
            ])
        elif host == "8.8.8.8":
            if getattr(self, "_large_response", False):
                class LargeStream(MockStream):
                    async def read(self, max_bytes: int, timeout: float = None) -> bytes:
                        return b"A" * 8192
                return LargeStream([b"HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\n"])
            else:
                return MockStream([
                    b"HTTP/1.1 302 Found\r\n",
                    b"Location: http://redirect-target.com/\r\n\r\n"
                ])
        elif host == "8.8.4.4":
            return MockStream([
                b"HTTP/1.1 200 OK\r\n",
                b"Content-Type: text/html\r\n\r\n",
                b"Target Reached"
            ])
        elif host == "9.9.9.9":
            return MockStream([
                b"HTTP/1.1 302 Found\r\n",
                b"Location: http://169.254.169.254/\r\n\r\n"
            ])
        return MockStream([b"HTTP/1.1 200 OK\r\n\r\n"])

    with patch("httpcore.AnyIOBackend.connect_tcp", new=mock_connect_tcp):
        yield

def test_public_destination_allowed(mock_dns, mock_tcp):
    collector = HTTPHeaderCollector(timeout=1.0)
    report = asyncio.run(collector.collect("public.com"))
    assert report.status == "success"
    assert len(report.results) == 1
    data = report.results[0].data
    assert data["status_code"] == 200
    assert data["headers"]["server"] == "TestServer"
    assert "TestGen" in data["meta_generators"]

def test_private_ipv4_rejected(mock_dns, mock_tcp):
    collector = HTTPHeaderCollector(timeout=1.0)
    
    report = asyncio.run(collector.collect("localhost"))
    assert report.status == "no_data"
    assert "Security rejection" in report.error_message
    
    report = asyncio.run(collector.collect("private.com"))
    assert report.status == "no_data"
    assert "Security rejection" in report.error_message

    report = asyncio.run(collector.collect("aws-metadata"))
    assert report.status == "no_data"
    assert "Security rejection" in report.error_message

def test_private_ipv6_rejected(mock_dns, mock_tcp):
    collector = HTTPHeaderCollector(timeout=1.0)
    
    report = asyncio.run(collector.collect("ipv6-local"))
    assert report.status == "no_data"
    assert "Security rejection" in report.error_message

    report = asyncio.run(collector.collect("ipv6-private"))
    assert report.status == "no_data"
    assert "Security rejection" in report.error_message

def test_dns_rebinding_rejected(mock_dns, mock_tcp):
    DNS_MOCK["rebind.com"] = ["192.168.1.1"]
    collector = HTTPHeaderCollector(timeout=1.0)
    report = asyncio.run(collector.collect("rebind.com"))
    assert report.status == "no_data"
    assert "Security rejection" in report.error_message

def test_redirect_to_private_rejected(mock_dns, mock_tcp):
    collector = HTTPHeaderCollector(timeout=1.0)
    report = asyncio.run(collector.collect("redirect-private.com"))
    assert report.status == "no_data"
    assert "Security rejection" in report.error_message

def test_redirect_chain_allowed(mock_dns, mock_tcp):
    collector = HTTPHeaderCollector(timeout=1.0)
    report = asyncio.run(collector.collect("redirect-chain.com"))
    assert report.status == "success"
    assert report.results[0].data["status_code"] == 200

def test_large_response_bounded(mock_dns):
    async def mock_connect_tcp_large(self, host, port, **kwargs):
        class LargeStream(MockStream):
            async def read(self, max_bytes: int, timeout: float = None) -> bytes:
                if self.index < len(self.chunks):
                    chunk = self.chunks[self.index]
                    self.index += 1
                    return chunk
                return b"A" * 8192
        return LargeStream([
            b"HTTP/1.1 200 OK\r\n",
            b"Content-Type: text/html\r\n\r\n"
        ])
        
    with patch("httpcore.AnyIOBackend.connect_tcp", new=mock_connect_tcp_large):
        collector = HTTPHeaderCollector(timeout=2.0)
        report = asyncio.run(collector.collect("public.com"))
        assert report.status == "success"
