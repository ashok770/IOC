import asyncio
import socket
import ipaddress
from typing import Optional
import httpx
import httpcore

class SSRFViolation(Exception):
    """Raised when a request attempts to connect to a private or reserved IP."""
    pass

class SafeBackend(httpcore.AsyncNetworkBackend):
    """
    Custom HTTPCore network backend that validates DNS resolution destinations
    to prevent SSRF and DNS rebinding attacks. Validates the resolved IP before
    connecting.
    """
    def __init__(self):
        self.default_backend = httpcore.AnyIOBackend()
    
    async def connect_tcp(self, host: str, port: int, timeout: Optional[float] = None, local_address: Optional[str] = None, **kwargs):
        loop = asyncio.get_running_loop()
        try:
            addr_info = await loop.getaddrinfo(host, port, type=socket.SOCK_STREAM)
        except socket.gaierror as e:
            raise Exception(f"DNS resolution failed for {host}: {e}")

        # Validate all resolved IPs to prevent fallback SSRF
        valid_ip = None
        for addr in addr_info:
            ip = addr[4][0]
            try:
                ip_obj = ipaddress.ip_address(ip)
            except ValueError:
                continue
                
            if (ip_obj.is_private or ip_obj.is_loopback or 
                ip_obj.is_link_local or ip_obj.is_multicast or 
                ip_obj.is_reserved or ip_obj.is_unspecified):
                raise SSRFViolation(f"Blocked connection to private/internal IP: {ip}")
        
        # If all IPs are safe public IPs, connect to the first one
        if not addr_info:
            raise SSRFViolation(f"No valid IP addresses found for {host}")
            
        valid_ip = addr_info[0][4][0]
            
        return await self.default_backend.connect_tcp(valid_ip, port, timeout=timeout, local_address=local_address, **kwargs)

    async def connect_unix_socket(self, *args, **kwargs):
        raise SSRFViolation("Unix sockets are not permitted")
    
    async def sleep(self, seconds: float):
        return await self.default_backend.sleep(seconds)


class SafeTransport(httpx.AsyncHTTPTransport):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._pool._network_backend = SafeBackend()
