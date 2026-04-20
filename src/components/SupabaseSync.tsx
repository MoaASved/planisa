import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/store/useAppStore';

/**
 * Loads all user data from Supabase on login and subscribes to realtime
 * changes. Resets the store on logout.
 */
export function SupabaseSync() {
  const { user, loading } = useAuth();
  const loadAll = useAppStore((s) => s.loadAll);
  const subscribeAll = useAppStore((s) => s.subscribeAll);
  const reset = useAppStore((s) => s.reset);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      reset();
      return;
    }

    loadAll(user.id).then(() => subscribeAll(user.id));

    return () => {
      // channels are torn down by the next subscribeAll/reset
    };
  }, [user, loading, loadAll, subscribeAll, reset]);

  return null;
}
