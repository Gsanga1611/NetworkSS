# Example curl requests for the backend

# Port scan
curl -X POST "http://localhost:8000/scan/port" -H "Content-Type: application/json" -d '{"ip":"127.0.0.1","ports":"1-1024"}'

# Network scan
curl -X POST "http://localhost:8000/scan/network" -H "Content-Type: application/json" -d '{"network":"192.168.1.0/24"}'

# Geolocation
curl -X POST "http://localhost:8000/geolocation" -H "Content-Type: application/json" -d '{"ip":"8.8.8.8"}'
