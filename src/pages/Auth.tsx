import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate('/', { replace: true });
  }, [session, loading, navigate]);

  const switchMode = (m: 'login' | 'signup') => {
    setMode(m);
    setAuthError(null);
    setSearchParams(m === 'signup' ? { mode: 'signup' } : {});
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      toast.error(err.message ?? 'Something went wrong');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
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
      if (mode === 'login') {
        setAuthError('Incorrect email or password. Please try again.');
      } else {
        toast.error(err.message ?? 'Something went wrong');
      }
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
            {forgotMode ? 'Reset your password' : mode === 'signup' ? 'Start your 14-day free trial' : 'Sign in to continue'}
          </p>
        </div>

        {/* Forgot password flow */}
        {forgotMode ? (
          <>
            {resetSent ? (
              <p className="text-sm text-center text-green-600 dark:text-green-400">
                Check your inbox for a password reset link.
              </p>
            ) : (
              <form onSubmit={handleForgotPassword} className="flex flex-col gap-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  autoComplete="email"
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-2xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground/40 text-[15px] outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow"
                />
                <button
                  type="submit"
                  disabled={resetLoading || !email}
                  className="w-full py-4 rounded-2xl bg-foreground text-background text-[15px] font-semibold tracking-tight active:scale-[0.98] transition-transform disabled:opacity-60 mt-1"
                >
                  {resetLoading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            )}
            <div className="text-center">
              <button
                onClick={() => { setForgotMode(false); setResetSent(false); }}
                className="text-sm text-muted-foreground"
              >
                Back to{' '}<span className="text-foreground font-medium">Sign in</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setAuthError(null); }}
                placeholder="Email"
                autoComplete="email"
                className="w-full px-4 py-3.5 rounded-2xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground/40 text-[15px] outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow"
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setAuthError(null); }}
                  placeholder="Password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full px-4 py-3.5 pr-11 rounded-2xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground/40 text-[15px] outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {mode === 'login' && (
                <div className="flex justify-end -mt-1">
                  <button
                    type="button"
                    onClick={() => setForgotMode(true)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {authError && (
                <p className="text-sm text-red-500 text-center -mt-1">{authError}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-foreground text-background text-[15px] font-semibold tracking-tight active:scale-[0.98] transition-transform disabled:opacity-60 mt-1"
              >
                {submitting ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
              </button>
            </form>

            {/* Consent — shown on signup only */}
            {mode === 'signup' && (
              <p className="text-xs text-muted-foreground/70 text-center leading-relaxed">
                By creating an account, you agree to our{' '}
                <a href="https://planisa.app/terms-of-use" target="_blank" rel="noopener noreferrer" className="underline hover:text-muted-foreground transition-colors">Terms of Use</a>
                {' '}and{' '}
                <a href="https://planisa.app/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-muted-foreground transition-colors">Privacy Policy</a>.
              </p>
            )}

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
          </>
        )}
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
