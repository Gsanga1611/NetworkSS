import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ArrowLeft, Search, Globe, Wifi, AlertTriangle, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  fetchGeolocation,
  simulatePortScan,
  simulateNetworkScan,
  type GeoData,
  type PortResult,
  type NetworkDevice,
} from '@/lib/scanner';

export default function ScanPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [targetIp, setTargetIp] = useState('');
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [portResults, setPortResults] = useState<PortResult[]>([]);
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [scanComplete, setScanComplete] = useState(false);

  const isValidIp = (ip: string) => {
    const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
    const domain = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](\.[a-zA-Z]{2,})+$/;
    return ipv4.test(ip) || domain.test(ip);
  };

  const handleScan = async () => {
    if (!isValidIp(targetIp)) {
      toast.error('Invalid IP address or domain');
      return;
    }

    setScanning(true);
    setProgress(0);
    setScanComplete(false);
    setPortResults([]);
    setDevices([]);
    setGeoData(null);

    // Step 1: Geolocation
    setStatusText('Fetching geolocation data...');
    const geo = await fetchGeolocation(targetIp);
    setGeoData(geo);
    setProgress(10);

    // Step 2: Port scan
    setStatusText('Scanning ports...');
    const ports = await simulatePortScan(targetIp, (p, _port) => {
      setProgress(10 + p * 0.7);
      setPortResults((prev) => [...prev, _port]);
    });

    // Step 3: Network scan
    setStatusText('Discovering network devices...');
    setProgress(85);
    const devs = await simulateNetworkScan();
    setDevices(devs);
    setProgress(100);
    setStatusText('Scan complete');
    setScanning(false);
    setScanComplete(true);

    // Save to database
    if (user) {
      const { error } = await supabase.from('scans').insert({
        user_id: user.id,
        target_ip: targetIp,
        geolocation_data: geo as any,
        port_results: ports as any,
        network_devices: devs as any,
      });
      if (error) {
        toast.error('Failed to save scan results');
      } else {
        toast.success('Scan saved successfully');
      }
    }
  };

  const openPorts = portResults.filter((p) => p.state === 'open');
  const vulnerabilities = portResults.filter((p) => p.vulnerability);

  return (
    <div className="min-h-screen bg-background matrix-bg scanline-effect">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-primary text-glow">Scan Target</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Input */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="bg-card border border-border rounded-lg p-6" style={{ boxShadow: 'var(--card-glow)' }}>
            <div className="font-mono text-xs text-muted-foreground mb-4">
              <span className="text-primary">$</span> nss scan --target
            </div>
            <div className="flex gap-3">
              <Input
                value={targetIp}
                onChange={(e) => setTargetIp(e.target.value)}
                placeholder="Enter IP address or domain (e.g. 8.8.8.8)"
                className="bg-muted border-border font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-primary"
                disabled={scanning}
              />
              <Button
                onClick={handleScan}
                disabled={scanning || !targetIp.trim()}
                className="bg-primary text-primary-foreground font-mono px-6 hover:bg-primary/90"
                style={{ boxShadow: scanning ? 'none' : 'var(--neon-glow)' }}
              >
                <Search className="w-4 h-4 mr-2" />
                {scanning ? 'SCANNING...' : 'SCAN'}
              </Button>
            </div>

            {scanning && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-muted-foreground">{statusText}</span>
                  <span className="font-mono text-xs text-primary">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {geoData && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <div className="bg-card border border-border rounded-lg p-6" style={{ boxShadow: 'var(--card-glow)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-4 h-4 text-accent" />
                  <h3 className="font-display font-semibold text-foreground">Geolocation</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 font-mono text-sm">
                  {[
                    ['IP', geoData.ip],
                    ['Country', geoData.country],
                    ['City', geoData.city],
                    ['ISP', geoData.isp],
                    ['Coordinates', `${geoData.lat}, ${geoData.lon}`],
                    ['Timezone', geoData.timezone],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <span className="text-xs text-muted-foreground block">{label}</span>
                      <span className="text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {portResults.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <div className="bg-card border border-border rounded-lg p-6" style={{ boxShadow: 'var(--card-glow)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-primary" />
                    <h3 className="font-display font-semibold text-foreground">Port Scan Results</h3>
                  </div>
                  <div className="flex gap-3 font-mono text-xs">
                    <span className="text-primary">{openPorts.length} open</span>
                    <span className="text-muted-foreground">{portResults.length - openPorts.length} closed/filtered</span>
                  </div>
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {portResults.map((p) => (
                    <div
                      key={p.port}
                      className="flex items-center justify-between py-1.5 px-3 rounded font-mono text-xs bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        {p.state === 'open' ? (
                          <CheckCircle className="w-3 h-3 text-primary" />
                        ) : p.state === 'filtered' ? (
                          <MinusCircle className="w-3 h-3 text-accent" />
                        ) : (
                          <XCircle className="w-3 h-3 text-muted-foreground" />
                        )}
                        <span className="text-foreground">:{p.port}</span>
                        <span className="text-muted-foreground">{p.service}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={p.state === 'open' ? 'text-primary' : 'text-muted-foreground'}>{p.state}</span>
                        {p.vulnerability && (
                          <span className="text-destructive flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {p.vulnerability}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {vulnerabilities.length > 0 && scanComplete && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <div className="bg-card border border-destructive/30 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <h3 className="font-display font-semibold text-destructive">Vulnerabilities Detected</h3>
                </div>
                <div className="space-y-2">
                  {vulnerabilities.map((v) => (
                    <div key={v.port} className="flex items-center gap-3 font-mono text-xs p-2 bg-destructive/10 rounded">
                      <span className="text-foreground">:{v.port} ({v.service})</span>
                      <span className="text-destructive">{v.vulnerability}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {devices.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-card border border-border rounded-lg p-6" style={{ boxShadow: 'var(--card-glow)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Wifi className="w-4 h-4 text-accent" />
                  <h3 className="font-display font-semibold text-foreground">Network Devices ({devices.length})</h3>
                </div>
                <div className="space-y-2">
                  {devices.map((d, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded font-mono text-xs">
                      <span className="text-foreground">{d.ip}</span>
                      <span className="text-muted-foreground">{d.mac}</span>
                      <span className="text-accent">{d.hostname}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
