# Backend (FastAPI)

This folder contains a minimal FastAPI backend that provides endpoints for:

- Port scanning (`/scan/port`) using `python-nmap` (requires `nmap` installed on host)
- Network discovery (`/scan/network`) using `scapy` or `arp-scan` (may require elevated privileges)
- IP geolocation (`/geolocation`) using `ip-api.com` with a `geoip2` DB fallback
- Health check (`/health`)

## Setup

On Windows/macOS/Linux with Python 3.10+:

```bash
# create venv
python -m venv .venv
# activate (PowerShell)
.venv\Scripts\Activate.ps1
# or cmd
.venv\Scripts\activate
# or bash (macOS/Linux)
source .venv/bin/activate

pip install -r backend/requirements.txt
```

Notes:
- `nmap` and `arp-scan` are system utilities and must be installed separately (e.g., apt, brew, or the Nmap installer for Windows).
- `scapy` may require running as root/Administrator for low-level packet operations.
- For improved geolocation accuracy you can download MaxMind GeoLite2 City DB and set `GEOLITE2_CITY_PATH` env var to its path.

## Run

```bash
# from repository root
uvicorn backend.main:app --reload --port 8000
```

## Example requests

Port scan:

```bash
curl -X POST "http://localhost:8000/scan/port" -H "Content-Type: application/json" -d '{"ip":"8.8.8.8","ports":"1-200"}'
```

Geolocation:

```bash
curl -X POST "http://localhost:8000/geolocation" -H "Content-Type: application/json" -d '{"ip":"8.8.8.8"}'
```

Network scan:

```bash
curl -X POST "http://localhost:8000/scan/network" -H "Content-Type: application/json" -d '{"network":"192.168.1.0/24"}'
```
