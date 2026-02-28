import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Globe, Search, AlertTriangle, Wifi, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface ScanRecord {
  id: string;
  target_ip: string;
  scan_date: string;
  geolocation_data: any;
  port_results: any;
  network_devices: any;
}

export default function ResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchScan = async () => {
      const { data } = await supabase
        .from('scans')
        .select('*')
        .eq('id', id)
        .single();
      if (data) setScan(data as ScanRecord);
      setLoading(false);
    };
    fetchScan();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-mono text-primary animate-pulse">Loading results...</p>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-4">
        <p className="font-mono text-muted-foreground">Scan not found</p>
        <Button onClick={() => navigate('/history')} className="font-mono bg-primary text-primary-foreground">
          Back to History
        </Button>
      </div>
    );
  }

  const geo = scan.geolocation_data as any;
  const ports = Array.isArray(scan.port_results) ? scan.port_results : [];
  const devices = Array.isArray(scan.network_devices) ? scan.network_devices : [];
  const openPorts = ports.filter((p: any) => p.state === 'open');
  const vulnerabilities = ports.filter((p: any) => p.vulnerability);

  return (
    <div className="min-h-screen bg-background matrix-bg scanline-effect">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/history')} className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-primary text-glow">Scan Results</span>
          <span className="font-mono text-xs text-muted-foreground ml-2">// {scan.target_ip}</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Summary */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6" style={{ boxShadow: 'var(--card-glow)' }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-center">
              <div>
                <p className="text-2xl font-bold text-primary text-glow">{scan.target_ip}</p>
                <p className="text-xs text-muted-foreground">Target</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{openPorts.length}</p>
                <p className="text-xs text-muted-foreground">Open Ports</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{vulnerabilities.length}</p>
                <p className="text-xs text-muted-foreground">Vulnerabilities</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">{devices.length}</p>
                <p className="text-xs text-muted-foreground">Devices</p>
              </div>
            </div>
          </div>

          {/* Geolocation */}
          {geo && (
            <div className="bg-card border border-border rounded-lg p-6 mb-6" style={{ boxShadow: 'var(--card-glow)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-accent" />
                <h3 className="font-display font-semibold text-foreground">Geolocation</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 font-mono text-sm">
                {[
                  ['Country', geo.country],
                  ['City', geo.city],
                  ['ISP', geo.isp],
                  ['Latitude', geo.lat],
                  ['Longitude', geo.lon],
                  ['Timezone', geo.timezone],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <span className="text-xs text-muted-foreground block">{label}</span>
                    <span className="text-foreground">{String(value || 'N/A')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ports */}
          {ports.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6 mb-6" style={{ boxShadow: 'var(--card-glow)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-4 h-4 text-primary" />
                <h3 className="font-display font-semibold text-foreground">Port Scan ({ports.length} scanned)</h3>
              </div>
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {ports.map((p: any) => (
                  <div key={p.port} className="flex items-center justify-between py-1.5 px-3 rounded font-mono text-xs bg-muted/50">
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
                    <span className={p.state === 'open' ? 'text-primary' : 'text-muted-foreground'}>{p.state}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vulnerabilities */}
          {vulnerabilities.length > 0 && (
            <div className="bg-card border border-destructive/30 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <h3 className="font-display font-semibold text-destructive">Vulnerabilities ({vulnerabilities.length})</h3>
              </div>
              <div className="space-y-2">
                {vulnerabilities.map((v: any) => (
                  <div key={v.port} className="flex items-center gap-3 font-mono text-xs p-2 bg-destructive/10 rounded">
                    <span className="text-foreground">:{v.port} ({v.service})</span>
                    <span className="text-destructive">{v.vulnerability}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Network Devices */}
          {devices.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6" style={{ boxShadow: 'var(--card-glow)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Wifi className="w-4 h-4 text-accent" />
                <h3 className="font-display font-semibold text-foreground">Network Devices ({devices.length})</h3>
              </div>
              <div className="space-y-2">
                {devices.map((d: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded font-mono text-xs">
                    <span className="text-foreground">{d.ip}</span>
                    <span className="text-muted-foreground">{d.mac}</span>
                    <span className="text-accent">{d.hostname}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
