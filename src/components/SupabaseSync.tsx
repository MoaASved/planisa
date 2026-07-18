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
  const { user, loading, userRecord } = useAuth();
  const loadAll = useAppStore((s) => s.loadAll);
  const subscribeAll = useAppStore((s) => s.subscribeAll);
  const reset = useAppStore((s) => s.reset);
  const updateSettings = useAppStore((s) => s.updateSettings);

  // Hydrate language preference from the saved profile once it's fetched, so the
  // Settings toggle reflects the server value. Uses setState directly (not
  // updateSettings) to avoid writing the just-fetched value back to Supabase.
  useEffect(() => {
    if (userRecord?.language_preference) {
      localStorage.setItem('language', userRecord.language_preference);
      useAppStore.setState((s) => ({ settings: { ...s.settings, language: userRecord.language_preference } }));
    }
  }, [userRecord?.language_preference]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      reset();
      return;
    }

    // Hydrate profile settings saved in Supabase auth user_metadata
    const meta = user.user_metadata ?? {};
    if (meta.display_name !== undefined || meta.avatar_initial !== undefined || meta.avatar_color !== undefined ||
        meta.avatar_type !== undefined || meta.avatar_emoji !== undefined || meta.avatar_url !== undefined) {
      updateSettings({
        name: meta.display_name ?? '',
        avatarInitial: meta.avatar_initial ?? 'U',
        avatarColor: (meta.avatar_color as PastelColor) ?? 'peony',
        avatarType: meta.avatar_type ?? 'initial',
        avatarEmoji: meta.avatar_emoji ?? '',
        avatarUrl: meta.avatar_url ?? '',
      });
    }

    loadAll(user.id).then(() => subscribeAll(user.id));
  }, [user, loading, loadAll, subscribeAll, reset, updateSettings]);

  return null;
}
