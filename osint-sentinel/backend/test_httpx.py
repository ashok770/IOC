import asyncio
import httpx
import httpcore
import ipaddress
import socket

class SafeBackend(httpcore.AsyncNetworkBackend):
    async def connect_tcp(
        self, host: str, port: int, timeout: float = None, local_address: str = None, **kwargs
    ):
        loop = asyncio.get_running_loop()
        # Resolve the host
        addr_info = await loop.getaddrinfo(host, port, family=socket.AF_INET, type=socket.SOCK_STREAM)
        
        # Validate all IPs
        for addr in addr_info:
            ip = addr[4][0]
            ip_obj = ipaddress.ip_address(ip)
            if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local:
                raise ValueError(f"Blocked connection to private IP: {ip}")
        
        # If safe, connect to the first IP
        safe_ip = addr_info[0][4][0]
        
        # We need an anyio backend or just standard httpcore backend
        # Wait, httpcore has a default backend we can wrap!
        default_backend = httpcore.AsyncAnyIOBackend()
        
        # Connect to the safe IP, but wait, httpcore needs the original host for SNI?
        # The connect_tcp method is just for TCP. TLS is wrapped later in connect_tls.
        # But wait, connect_tcp takes host, port. If we pass safe_ip instead of host, the socket connects to safe_ip.
        # Let's try!
        stream = await default_backend.connect_tcp(safe_ip, port, timeout=timeout, local_address=local_address, **kwargs)
        return stream

    async def connect_unix_socket(self, *args, **kwargs):
        raise NotImplementedError()
    async def sleep(self, seconds: float):
        await asyncio.sleep(seconds)

async def main():
    transport = httpx.AsyncHTTPTransport(network_backend=SafeBackend())
    async with httpx.AsyncClient(transport=transport) as client:
        resp = await client.get("http://example.com")
        print(resp.status_code)

asyncio.run(main())
