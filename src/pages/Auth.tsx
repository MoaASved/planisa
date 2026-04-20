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
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm bg-card rounded-3xl shadow-sm border border-border/40 p-8">
        <h1 className="flow-page-title text-center mb-1">
          {mode === 'signup' ? 'Create account' : 'Welcome back'}
        </h1>
        <p className="flow-meta text-center text-muted-foreground mb-6">
          {mode === 'signup' ? 'Start your 14-day free trial' : 'Sign in to continue'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="flow-label block mb-1.5 text-muted-foreground">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-secondary/60 border border-border/40 outline-none focus:border-foreground/30 transition-colors text-sm"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="flow-label block mb-1.5 text-muted-foreground">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-secondary/60 border border-border/40 outline-none focus:border-foreground/30 transition-colors text-sm"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-xl bg-foreground text-background font-medium text-sm transition-opacity active:opacity-80 disabled:opacity-50 mt-2"
          >
            {submitting ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 text-center">
          {mode === 'signup' ? (
            <button onClick={() => switchMode('login')} className="text-sm text-muted-foreground hover:text-foreground">
              Already have an account? <span className="text-foreground font-medium">Sign in</span>
            </button>
          ) : (
            <button onClick={() => switchMode('signup')} className="text-sm text-muted-foreground hover:text-foreground">
              No account? <span className="text-foreground font-medium">Create one</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
