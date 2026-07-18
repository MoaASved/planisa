import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type SubscriptionStatus = 'trialing' | 'active' | 'expired' | 'lifetime' | 'beta' | string;

export interface UserRecord {
  id: string;
  email: string;
  subscription_status: SubscriptionStatus;
  trial_start_date: string;
  trial_ends_at?: string | null;
  created_at: string;
  language_preference: 'en' | 'sv';
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  userRecord: UserRecord | null;
  loading: boolean;
  hasFullAccess: boolean;
  signOut: () => Promise<void>;
  refreshUserRecord: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TRIAL_DAYS = 14;
const BETA_DAYS = 30;

function trialExpiry(record: UserRecord, fallbackDays: number): number {
  if (record.trial_ends_at) return new Date(record.trial_ends_at).getTime();
  return new Date(record.trial_start_date).getTime() + fallbackDays * 24 * 60 * 60 * 1000;
}

function computeFullAccess(record: UserRecord | null): boolean {
  if (!record) return false;
  if (record.subscription_status === 'active') return true;
  if (record.subscription_status === 'lifetime') return true;
  if (record.subscription_status === 'trialing') {
    return Date.now() <= trialExpiry(record, TRIAL_DAYS);
  }
  if (record.subscription_status === 'beta') {
    return Date.now() <= trialExpiry(record, BETA_DAYS);
  }
  return false;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRecord, setUserRecord] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRecord = async (uid: string) => {
    const { data } = await (supabase.from('users' as any).select('*').eq('id', uid).maybeSingle() as any);
    setUserRecord((data as UserRecord | null) ?? null);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        setTimeout(() => { fetchUserRecord(newSession.user.id); }, 0);
      } else {
        setUserRecord(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      if (existing?.user) {
        fetchUserRecord(existing.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshUserRecord = async () => {
    if (user) await fetchUserRecord(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        userRecord,
        loading,
        hasFullAccess: computeFullAccess(userRecord),
        signOut,
        refreshUserRecord,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
