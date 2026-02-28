import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Clock, Globe, ChevronRight } from 'lucide-react';
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

export default function HistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchScans = async () => {
      const { data } = await supabase
        .from('scans')
        .select('*')
        .order('scan_date', { ascending: false });
      if (data) setScans(data as ScanRecord[]);
      setLoading(false);
    };
    fetchScans();
  }, [user]);

  return (
    <div className="min-h-screen bg-background matrix-bg scanline-effect">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-primary text-glow">Scan History</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="font-mono text-xs text-muted-foreground mb-6">
            <span className="text-primary">$</span> nss history --list
          </div>

          {loading ? (
            <div className="text-center py-12 font-mono text-muted-foreground animate-pulse">
              Loading scan history...
            </div>
          ) : scans.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="font-mono text-muted-foreground">No scans recorded yet</p>
              <Button
                onClick={() => navigate('/scan')}
                className="mt-4 bg-primary text-primary-foreground font-mono"
                style={{ boxShadow: 'var(--neon-glow)' }}
              >
                Run First Scan
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {scans.map((scan, i) => {
                const geo = scan.geolocation_data as any;
                const ports = Array.isArray(scan.port_results) ? scan.port_results : [];
                const openCount = ports.filter((p: any) => p.state === 'open').length;

                return (
                  <motion.div
                    key={scan.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <button
                      onClick={() => navigate(`/results/${scan.id}`)}
                      className="w-full text-left bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-all group"
                      style={{ boxShadow: 'var(--card-glow)' }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center">
                            <Globe className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-mono text-sm text-foreground font-semibold">{scan.target_ip}</p>
                            <div className="flex gap-3 font-mono text-xs text-muted-foreground mt-1">
                              <span>{new Date(scan.scan_date).toLocaleDateString()}</span>
                              {geo?.country && <span>{geo.country}</span>}
                              <span className="text-primary">{openCount} open ports</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
