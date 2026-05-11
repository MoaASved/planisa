import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Auth() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate('/', { replace: true });
  }, [session, loading, navigate]);

  const switchMode = (m: 'login' | 'signup') => {
    setMode(m);
    setSearchParams(m === 'signup' ? { mode: 'signup' } : {});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success('Account created. You can now sign in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <style>{`
        @keyframes auth-nisa-float {
          0%, 100% { transform: rotate(-6deg) translateY(0px); }
          50%       { transform: rotate(-6deg) translateY(-9px); }
        }
      `}</style>

      {/* NISA */}
      <img
        src="/nisa.png"
        alt="NISA"
        style={{
          width: 110,
          height: 110,
          objectFit: 'contain',
          borderRadius: 20,
          boxShadow: '0 10px 36px rgba(0,0,0,0.13)',
          animation: 'auth-nisa-float 2.6s ease-in-out infinite',
          marginBottom: 24,
        }}
      />

      {/* Card */}
      <div className="w-full max-w-sm bg-card rounded-3xl shadow-sm p-8 flex flex-col gap-6">

        {/* Logo + tagline */}
        <div className="flex flex-col items-center gap-1.5">
          <img src="/Planisa-logo.png" alt="Planisa" className="h-8 w-auto" />
          <p className="text-[15px] text-muted-foreground">
            {mode === 'signup' ? 'Start your 14-day free trial' : 'Sign in to continue'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="w-full px-4 py-3.5 rounded-2xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground/40 text-[15px] outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            className="w-full px-4 py-3.5 rounded-2xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground/40 text-[15px] outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-foreground text-background text-[15px] font-semibold tracking-tight active:scale-[0.98] transition-transform disabled:opacity-60 mt-1"
          >
            {submitting ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        {/* Switch mode */}
        <div className="text-center">
          {mode === 'signup' ? (
            <button onClick={() => switchMode('login')} className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <span className="text-foreground font-medium">Sign in</span>
            </button>
          ) : (
            <button onClick={() => switchMode('signup')} className="text-sm text-muted-foreground">
              No account?{' '}
              <span className="text-foreground font-medium">Create one</span>
            </button>
          )}
        </div>
      </div>

      <a
        href="https://planisa.app"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      >
        Learn more at planisa.app
      </a>
    </div>
  );
}
