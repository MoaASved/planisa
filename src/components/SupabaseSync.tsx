import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { PastelColor } from '@/types';

/**
 * Loads all user data from Supabase on login and subscribes to realtime
 * changes. Resets the store on logout.
 * Also hydrates profile settings (display name, avatar) from auth user_metadata.
 */
export function SupabaseSync() {
  const { user, loading } = useAuth();
  const loadAll = useAppStore((s) => s.loadAll);
  const subscribeAll = useAppStore((s) => s.subscribeAll);
  const reset = useAppStore((s) => s.reset);
  const updateSettings = useAppStore((s) => s.updateSettings);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      reset();
      return;
    }

    // Hydrate profile settings saved in Supabase auth user_metadata
    const meta = user.user_metadata ?? {};
    if (meta.display_name !== undefined || meta.avatar_initial !== undefined || meta.avatar_color !== undefined) {
      updateSettings({
        name: meta.display_name ?? '',
        avatarInitial: meta.avatar_initial ?? 'U',
        avatarColor: (meta.avatar_color as PastelColor) ?? 'peony',
      });
    }

    loadAll(user.id).then(() => subscribeAll(user.id));
  }, [user, loading, loadAll, subscribeAll, reset, updateSettings]);

  return null;
}
