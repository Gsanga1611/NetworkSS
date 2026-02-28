import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Scan, History, BarChart3, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Scan New IP',
      description: 'Run port scan, geolocation & network discovery',
      icon: Scan,
      path: '/scan',
      color: 'primary',
    },
    {
      title: 'Recent Scans',
      description: 'View previously scanned IP addresses',
      icon: History,
      path: '/history',
      color: 'accent',
    },
    {
      title: 'Scan Results',
      description: 'Detailed analysis of completed scans',
      icon: BarChart3,
      path: '/history',
      color: 'primary',
    },
  ];

  return (
    <div className="min-h-screen bg-background matrix-bg scanline-effect">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-display font-bold text-xl text-primary text-glow">NetworkSS</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="hidden sm:block">
                <p className="font-mono text-sm text-foreground">{profile?.username || 'Operator'}</p>
                <p className="font-mono text-xs text-muted-foreground capitalize">{role || 'user'}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut()}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-foreground mb-1">
              Welcome back, <span className="text-primary text-glow">{profile?.username || 'Operator'}</span>
            </h1>
            <p className="font-mono text-sm text-muted-foreground">
              <span className="text-primary">$</span> dashboard --status=active
            </p>
          </div>

          {/* Status bar */}
          <div className="bg-card border border-border rounded-lg p-4 mb-8 font-mono text-xs" style={{ boxShadow: 'var(--card-glow)' }}>
            <div className="flex flex-wrap gap-6">
              <div>
                <span className="text-muted-foreground">STATUS:</span>{' '}
                <span className="text-primary">● ONLINE</span>
              </div>
              <div>
                <span className="text-muted-foreground">ROLE:</span>{' '}
                <span className="text-foreground uppercase">{role || 'user'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">SESSION:</span>{' '}
                <span className="text-foreground">SECURE</span>
              </div>
            </div>
          </div>

          {/* Action cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {actions.map((action, i) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 + 0.2 }}
              >
                <button
                  onClick={() => navigate(action.path)}
                  className="w-full text-left bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-all group"
                  style={{ boxShadow: 'var(--card-glow)' }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center group-hover:border-primary/50 transition-colors">
                      <action.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                      {action.title}
                    </h3>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">{action.description}</p>
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
