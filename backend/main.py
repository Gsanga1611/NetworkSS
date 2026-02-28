from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
import subprocess
import json

app = FastAPI(title="Network Sentinel Backend")

# Allow requests from local frontend during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class IPItem(BaseModel):
    ip: str

class PortScanRequest(BaseModel):
    ip: str
    ports: str = "1-1024"

class NetworkScanRequest(BaseModel):
    network: str = "192.168.1.0/24"

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/geolocation")
async def geolocation(item: IPItem):
    ip = item.ip
    # Try public API first
    try:
        import requests
        resp = requests.get(f"http://ip-api.com/json/{ip}", timeout=5)
        data = resp.json()
        if data.get("status") == "success":
            return data
    except Exception:
        pass

    # Fallback: if geoip2 DB is available
    try:
        import geoip2.database
        db_path = os.getenv("GEOLITE2_CITY_PATH")
        if db_path and os.path.exists(db_path):
            reader = geoip2.database.Reader(db_path)
            rec = reader.city(ip)
            return {
                "query": ip,
                "country": rec.country.name,
                "city": rec.city.name,
                "lat": rec.location.latitude,
                "lon": rec.location.longitude,
                "isp": None,
            }
    except Exception:
        pass

    raise HTTPException(status_code=502, detail="Geolocation lookup failed")

@app.post("/scan/port")
async def scan_port(req: PortScanRequest):
    ip = req.ip
    ports = req.ports

    # Prefer python-nmap (requires nmap installed on host)
    try:
        import nmap
        scanner = nmap.PortScanner()
        # nmap may require root for some options; using basic scan
        scanner.scan(hosts=ip, ports=ports, arguments='-sS -Pn')
        result = []
        host = ip
        if host in scanner.all_hosts():
            for proto in scanner[host].all_protocols():
                lports = scanner[host][proto].keys()
                for p in sorted(lports):
                    state = scanner[host][proto][p]['state']
                    service = scanner[host][proto][p].get('name')
                    result.append({"port": p, "state": state, "service": service})
        return {"host": ip, "ports": result}
    except Exception:
        # Fallback simulated results
        common = [22, 80, 443, 3389, 5432]
        simulated = []
        for p in common:
            simulated.append({"port": p, "state": "open" if p % 2 == 0 else "closed", "service": "simulated"})
        return {"host": ip, "ports": simulated, "note": "simulated (nmap unavailable)"}

@app.post("/scan/network")
async def scan_network(req: NetworkScanRequest):
    network = req.network

    # Try scapy ARP ping (requires root on many systems)
    try:
        from scapy.all import arping
        ans, _ = arping(network, timeout=2, verbose=False)
        devices = []
        for s, r in ans:
            devices.append({"ip": r.psrc, "mac": r.hwsrc})
        return {"network": network, "devices": devices}
    except Exception:
        # Fallback: try `arp-scan` command if installed
        try:
            out = subprocess.check_output(["arp-scan", "-l"], stderr=subprocess.DEVNULL, timeout=6)
            lines = out.decode().splitlines()
            devices = []
            for line in lines:
                parts = line.split()
                if len(parts) >= 2 and parts[0].count('.') == 3:
                    devices.append({"ip": parts[0], "mac": parts[1]})
            if devices:
                return {"network": network, "devices": devices}
        except Exception:
            pass

    # Simulated fallback
    return {
        "network": network,
        "devices": [
            {"ip": "192.168.1.1", "mac": "AA:BB:CC:DD:EE:01"},
            {"ip": "192.168.1.12", "mac": "AA:BB:CC:DD:EE:02"},
        ],
        "note": "simulated (scapy/arp-scan not available)"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), log_level="info")
