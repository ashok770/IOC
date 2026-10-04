import asyncio
import socket
import ssl

async def test():
    domain = 'example.com'
    # 1. Resolve
    loop = asyncio.get_running_loop()
    addr_info = await loop.getaddrinfo(domain, 443, family=socket.AF_INET, type=socket.SOCK_STREAM)
    ip = addr_info[0][4][0]
    
    # 2. Connect
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    reader, writer = await asyncio.open_connection(ip, 443, ssl=ctx, server_hostname=domain)
    
    # 3. Send request
    req = f"GET / HTTP/1.1\r\nHost: {domain}\r\nUser-Agent: OSINT-Sentinel\r\nConnection: close\r\n\r\n"
    writer.write(req.encode())
    await writer.drain()
    
    # 4. Read response
    resp = await reader.read(1024)
    print(resp.decode().split('\r\n')[0])
    
    writer.close()
    await writer.wait_closed()

asyncio.run(test())
