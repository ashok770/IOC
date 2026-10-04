import asyncio
import httpx
import httpcore
import ipaddress
import socket

class SafeBackend(httpcore.AsyncNetworkBackend):
    def __init__(self):
        self.default_backend = httpcore.AnyIOBackend()
    
    async def connect_tcp(self, host: str, port: int, timeout=None, local_address=None, **kwargs):
        loop = asyncio.get_running_loop()
        addr_info = await loop.getaddrinfo(host, port, family=socket.AF_INET, type=socket.SOCK_STREAM)
        
        valid_ip = None
        for addr in addr_info:
            ip = addr[4][0]
            ip_obj = ipaddress.ip_address(ip)
            if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local or ip_obj.is_multicast or ip_obj.is_reserved or ip_obj.is_unspecified:
                raise ValueError(f"Blocked connection to private IP: {ip}")
            valid_ip = ip
            break
            
        print(f"Connecting safely to {valid_ip} for host {host}")
        stream = await self.default_backend.connect_tcp(valid_ip, port, timeout=timeout, local_address=local_address, **kwargs)
        return stream

    async def connect_unix_socket(self, *args, **kwargs):
        return await self.default_backend.connect_unix_socket(*args, **kwargs)
    
    async def sleep(self, seconds: float):
        return await self.default_backend.sleep(seconds)

class SafeTransport(httpx.AsyncHTTPTransport):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._pool._network_backend = SafeBackend()

async def test():
    transport = SafeTransport(verify=False)
    async with httpx.AsyncClient(transport=transport) as client:
        r = await client.get('https://example.com')
        print(r.status_code)

asyncio.run(test())
