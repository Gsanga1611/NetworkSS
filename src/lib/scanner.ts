// Scanner helpers that call the FastAPI backend when available,
// with safe simulated fallbacks for local development.

export interface GeoData {
  ip: string;
  country: string;
  city: string;
  isp: string;
  lat: number;
  lon: number;
  timezone?: string;
}

export interface PortResult {
  port: number;
  state: 'open' | 'closed' | 'filtered';
  service: string;
  vulnerability?: string;
}

export interface NetworkDevice {
  ip: string;
  mac?: string;
  hostname?: string;
}

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || 'http://localhost:8000';

const COMMON_PORTS: { port: number; service: string; vulnerability?: string }[] = [
  { port: 21, service: 'FTP', vulnerability: 'Anonymous login possible' },
  { port: 22, service: 'SSH' },
  { port: 23, service: 'Telnet', vulnerability: 'Unencrypted protocol' },
  { port: 25, service: 'SMTP' },
  { port: 53, service: 'DNS' },
  { port: 80, service: 'HTTP', vulnerability: 'No HTTPS redirect' },
  { port: 110, service: 'POP3' },
  { port: 143, service: 'IMAP' },
  { port: 443, service: 'HTTPS' },
  { port: 445, service: 'SMB', vulnerability: 'EternalBlue (MS17-010)' },
  { port: 993, service: 'IMAPS' },
  { port: 995, service: 'POP3S' },
  { port: 3306, service: 'MySQL', vulnerability: 'Default credentials' },
  { port: 3389, service: 'RDP', vulnerability: 'BlueKeep (CVE-2019-0708)' },
  { port: 5432, service: 'PostgreSQL' },
  { port: 8080, service: 'HTTP-Proxy' },
  { port: 8443, service: 'HTTPS-Alt' },
];

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchGeolocation(ip: string): Promise<GeoData> {
  // Try backend first
  try {
    const res = await fetch(`${BACKEND_URL}/geolocation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip }),
    });
    if (res.ok) {
      const data = await res.json();
      // normalize to GeoData
      return {
        ip: data.query || ip,
        country: data.country || data.countryName || 'Unknown',
        city: data.city || null,
        isp: data.isp || null,
        lat: data.lat || data.location?.latitude || 0,
        lon: data.lon || data.location?.longitude || 0,
        timezone: data.timezone || data.time_zone || undefined,
      };
    }
  } catch (err) {
    // ignore and fallback
  }

  // Fallback to public API as previously
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await res.json();
    if (data.status === 'success') {
      return {
        ip: data.query,
        country: data.country,
        city: data.city,
        isp: data.isp,
        lat: data.lat,
        lon: data.lon,
        timezone: data.timezone,
      };
    }
  } catch {}

  // final simulated fallback
  return {
    ip,
    country: 'United States',
    city: 'San Francisco',
    isp: 'Cloudflare Inc',
    lat: 37.7749,
    lon: -122.4194,
  };
}

export async function simulatePortScan(
  ip: string,
  onProgress: (progress: number, port: PortResult) => void,
  ports: string = '1-1024'
): Promise<PortResult[]> {
  // Call backend scan/port endpoint when available
  try {
    const res = await fetch(`${BACKEND_URL}/scan/port`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, ports }),
    });
    if (res.ok) {
      const body = await res.json();
      const portResults: PortResult[] = (body.ports || []).map((p: any) => ({
        port: p.port,
        state: p.state || (p.open ? 'open' : 'closed'),
        service: p.service || p.name || 'unknown',
      }));

      // Emit progress events sequentially for UX
      for (let i = 0; i < portResults.length; i++) {
        await sleep(80);
        onProgress(((i + 1) / portResults.length) * 100, portResults[i]);
      }
      return portResults;
    }
  } catch (err) {
    // ignore and fallback
  }

  // Local simulated behavior as fallback
  const results: PortResult[] = [];
  for (let i = 0; i < COMMON_PORTS.length; i++) {
    await sleep(150 + Math.random() * 200);
    const p = COMMON_PORTS[i];
    const isOpen = Math.random() > 0.5;
    const result: PortResult = {
      port: p.port,
      state: isOpen ? 'open' : Math.random() > 0.7 ? 'filtered' : 'closed',
      service: p.service,
      vulnerability: isOpen ? p.vulnerability : undefined,
    };
    results.push(result);
    onProgress(((i + 1) / COMMON_PORTS.length) * 100, result);
  }
  return results;
}

export async function simulateNetworkScan(network: string = '192.168.1.0/24'): Promise<NetworkDevice[]> {
  // Try backend
  try {
    const res = await fetch(`${BACKEND_URL}/scan/network`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ network }),
    });
    if (res.ok) {
      const body = await res.json();
      return (body.devices || []).map((d: any) => ({ ip: d.ip, mac: d.mac, hostname: d.hostname }));
    }
  } catch (err) {
    // ignore and fallback
  }

  // Simulated fallback
  await sleep(800);
  const devices: NetworkDevice[] = [];
  const count = 3 + Math.floor(Math.random() * 5);
  for (let i = 0; i < count; i++) {
    devices.push({
      ip: `192.168.1.${Math.floor(Math.random() * 200) + 2}`,
      mac: Array.from({ length: 6 }, () =>
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
      ).join(':').toUpperCase(),
      hostname:
        ['router', 'laptop', 'phone', 'printer', 'smart-tv', 'camera', 'nas'][
          Math.floor(Math.random() * 7)
        ] + `-${i + 1}`,
    });
  }
  return devices;
}
