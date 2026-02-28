import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Access granted');
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background matrix-bg scanline-effect flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-lg border border-border bg-card mb-4"
            style={{ boxShadow: 'var(--card-glow)' }}
          >
            <Shield className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-bold font-display text-primary text-glow">NetworkSS</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">Network Security Scanner</p>
        </div>

        {/* Form */}
        <div className="bg-card border border-border rounded-lg p-6" style={{ boxShadow: 'var(--card-glow)' }}>
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-border">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="font-mono text-sm text-muted-foreground">$ authenticate --login</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-mono text-xs text-muted-foreground mb-1 block">EMAIL</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@network.ss"
                className="bg-muted border-border font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-muted-foreground mb-1 block">PASSWORD</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-muted border-border font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-mono font-bold hover:bg-primary/90 transition-all"
              style={{ boxShadow: loading ? 'none' : 'var(--neon-glow)' }}
            >
              {loading ? (
                <span className="animate-pulse">AUTHENTICATING...</span>
              ) : (
                'AUTHENTICATE'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/register" className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors">
              No credentials? <span className="text-primary">Register new operator</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
