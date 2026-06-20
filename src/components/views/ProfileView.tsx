import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  Mail,
  Lock,
  Moon,
  Sun,
  ChevronRight,
  ChevronDown,
  LogOut,
  Folder,
  Calendar,
  CheckSquare,
  Edit3,
  X,
  CreditCard,
  HelpCircle,
  MessageSquareDot,
  Shield,
  FileText,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { pastelColors, getAccentTextClass } from '@/lib/colors';
import { PastelColor } from '@/types';
import { CategoryEditDrawer } from '@/components/modals/CategoryEditDrawer';
import { useVisualViewport } from '@/hooks/useVisualViewport';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const PRICE_MONTHLY = 'price_1Tk8iGBzzA5y3GWGJXt3d34j';
const PRICE_YEARLY = 'price_1Tk8kgBzzA5y3GWGhNunooOM';

type CategorySection = 'calendar' | 'tasks' | 'notes';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileView() {
  const { 
    settings, 
    updateSettings, 
    taskCategories, 
    addTaskCategory, 
    updateTaskCategory,
    deleteTaskCategory,
    eventCategories,
    addEventCategory,
    updateEventCategory,
    deleteEventCategory,
    folders,
    addFolder,
    updateFolder,
    deleteFolder,
  } = useAppStore();
  const { signOut, user, userRecord, hasFullAccess } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null); // holds priceId while loading
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);


  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarInitial, setAvatarInitial] = useState(settings.avatarInitial || 'U');
  const [avatarColor, setAvatarColor] = useState<PastelColor>(settings.avatarColor || 'peony');
  const [userName, setUserName] = useState(settings.name || '');

  // Section-wise category management
  const [expandedSection, setExpandedSection] = useState<CategorySection | null>(null);
  
  // Add new category/folder drawer
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [addDrawerSection, setAddDrawerSection] = useState<CategorySection>('calendar');
  const [newItemName, setNewItemName] = useState('');
  const [newItemColor, setNewItemColor] = useState<PastelColor>('peony');

  // Edit category/folder drawer
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editItemSection, setEditItemSection] = useState<CategorySection>('calendar');
  const [editItemName, setEditItemName] = useState('');
  const [editItemColor, setEditItemColor] = useState<PastelColor>('peony');
  const [editItemIsDefault, setEditItemIsDefault] = useState(false);

  // NISA resting state
  const [nisaLastMessage, setNisaLastMessage] = useState<string | null>(null);
  const [nisaDismissed, setNisaDismissed] = useState(false);
  const [showNisaMessage, setShowNisaMessage] = useState(false);

  useEffect(() => {
    setNisaLastMessage(localStorage.getItem('nisa_last_message'));
    setNisaDismissed(!!localStorage.getItem(`nisa_dismissed_${new Date().toDateString()}`));
  }, []);

  const handlePortal = async () => {
    if (!user) return;
    setPortalLoading(true);
    const win = window.open('', '_blank');
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { userId: user.id },
      });
      if (error) throw new Error(error.message);
      if (data?.url) {
        if (win) win.location.href = data.url;
        else window.location.href = data.url;
      } else {
        win?.close();
        throw new Error('No portal URL returned');
      }
    } catch (err) {
      win?.close();
      toast.error('Could not open billing portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCheckout = async (priceId: string) => {
    if (!user) return;
    setCheckoutLoading(priceId);
    setCheckoutError(null);

    // Open the window immediately while still in the user-gesture call stack,
    // otherwise browsers block window.open called after an await.
    const win = window.open('', '_blank');

    try {
      console.log('[checkout] invoking create-checkout-session', { priceId, userId: user.id });
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId, userId: user.id },
      });
      console.log('[checkout] raw response', { data, error });

      if (error) {
        // Extract the actual error body from the Edge Function response
        let msg = error.message;
        try {
          const body = await (error as any).context?.json?.();
          console.error('[checkout] edge function error body', body);
          if (body?.error) msg = body.error;
        } catch (parseErr) {
          console.error('[checkout] could not parse error body', parseErr);
        }
        throw new Error(msg);
      }

      // data itself may contain an error field if the function returned 2xx with an error
      if (data?.error) {
        console.error('[checkout] data.error', data.error);
        throw new Error(data.error);
      }

      if (data?.url) {
        if (win) {
          win.location.href = data.url;
        } else {
          // Popup was blocked — fall back to same-tab navigation
          window.location.href = data.url;
        }
      } else {
        win?.close();
        console.error('[checkout] unexpected response shape', data);
        throw new Error('No checkout URL returned — check Edge Function logs');
      }
    } catch (err) {
      const msg = (err as Error).message;
      console.error('[checkout] final error:', msg);
      win?.close();
      setCheckoutError(msg);
      toast.error(msg);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const toggleDarkMode = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
    document.documentElement.classList.toggle('dark');
  };

  // Sync modal fields from store whenever the modal opens
  useEffect(() => {
    if (showAvatarModal) {
      setUserName(settings.name || '');
      setAvatarInitial(settings.avatarInitial || 'U');
      setAvatarColor(settings.avatarColor || 'peony');
    }
  }, [showAvatarModal]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveAvatar = async () => {
    const trimmedName = userName.trim();
    // Persist to Supabase auth user_metadata so it survives page reload
    await supabase.auth.updateUser({
      data: {
        display_name: trimmedName,
        avatar_initial: avatarInitial,
        avatar_color: avatarColor,
      },
    });
    updateSettings({ name: trimmedName, avatarInitial, avatarColor });
    setShowAvatarModal(false);
  };

  const openAddDrawer = (section: CategorySection) => {
    setAddDrawerSection(section);
    setNewItemName('');
    setNewItemColor('peony');
    setShowAddDrawer(true);
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    
    switch (addDrawerSection) {
      case 'calendar':
        addEventCategory({ name: newItemName.trim(), color: newItemColor });
        break;
      case 'tasks':
        addTaskCategory({ name: newItemName.trim(), color: newItemColor });
        break;
      case 'notes':
        addFolder({ name: newItemName.trim(), color: newItemColor });
        break;
    }
    
    setNewItemName('');
    setShowAddDrawer(false);
  };

  const openEditDrawer = (section: CategorySection, id: string, name: string, color: PastelColor, isDefault = false) => {
    setEditItemSection(section);
    setEditItemId(id);
    setEditItemName(name);
    setEditItemColor(color);
    setEditItemIsDefault(isDefault);
    setShowEditDrawer(true);
  };

  const handleUpdateItem = () => {
    if (!editItemId || !editItemName.trim()) return;
    
    switch (editItemSection) {
      case 'calendar':
        updateEventCategory(editItemId, { name: editItemName.trim(), color: editItemColor });
        break;
      case 'tasks':
        updateTaskCategory(editItemId, { name: editItemName.trim(), color: editItemColor });
        break;
      case 'notes':
        updateFolder(editItemId, { name: editItemName.trim(), color: editItemColor });
        break;
    }
    
    setShowEditDrawer(false);
    setEditItemId(null);
  };

  const handleDeleteItem = (section: CategorySection, id: string) => {
    switch (section) {
      case 'calendar':
        deleteEventCategory(id);
        break;
      case 'tasks':
        deleteTaskCategory(id);
        break;
      case 'notes':
        deleteFolder(id);
        break;
    }
  };

  const toggleSection = (section: CategorySection) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const { modalTop, maxHeight } = useVisualViewport(70);

  return (
    <div className="min-h-screen pb-24 pt-safe-2">
      <div className="px-4 pb-4 space-y-6">
        {/* User Info Card */}
        <div className="flow-card">
          <button onClick={() => setShowAvatarModal(true)} className="flex items-center gap-4 w-full text-left">
            <div
              className={cn('w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold', getAccentTextClass(settings.avatarColor || 'peony'))}
              style={{ backgroundColor: `hsl(var(--pastel-${settings.avatarColor || 'peony'}))` }}
            >
              {settings.avatarInitial || settings.name?.trim()?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{settings.name || 'Planisa User'}</h3>
              <p className="text-sm text-muted-foreground">{user?.email ?? 'No email registered'}</p>
              <span className="text-xs text-muted-foreground">Tap to edit profile</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* NISA Resting State */}
        <div className="flow-card">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowNisaMessage(v => !v)}
              className="relative flex-shrink-0"
            >
              <img
                src="/nisa.png"
                alt="Nisa"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 14,
                  opacity: nisaDismissed ? 0.55 : 1,
                  transform: nisaDismissed ? 'rotate(-8deg)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground/40">Nisa</p>
            </div>
            <button
              onClick={() => setShowNisaMessage(v => !v)}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0"
            >
              <ChevronDown
                className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200', showNisaMessage && 'rotate-180')}
              />
            </button>
          </div>
          {showNisaMessage && nisaLastMessage && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-sm text-foreground leading-relaxed">{nisaLastMessage}</p>
            </div>
          )}
          {showNisaMessage && !nisaLastMessage && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-sm text-muted-foreground italic">No message yet...</p>
            </div>
          )}
        </div>

        {/* Plan */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">Plan</h3>
          {hasFullAccess && (userRecord?.subscription_status === 'active' || userRecord?.subscription_status === 'lifetime') ? (
            <div className="flow-card-flat p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {userRecord.subscription_status === 'lifetime' ? 'Lifetime Access' : 'Planisa Pro'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {userRecord.subscription_status === 'lifetime' ? 'You have lifetime access.' : 'Active subscription — full access enabled.'}
                  </p>
                </div>
              </div>
              {userRecord.subscription_status === 'active' && (
                <button
                  onClick={handlePortal}
                  disabled={portalLoading}
                  className="w-full py-3 rounded-2xl border border-border text-foreground text-[15px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-60"
                >
                  {portalLoading ? 'Opening…' : 'Manage subscription'}
                </button>
              )}
            </div>
          ) : (
            <div className="flow-card-flat p-4 space-y-3">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Upgrade to Pro</p>
                  <p className="text-sm text-muted-foreground">Unlock Tasks, Notes, and everything else.</p>
                </div>
              </div>
              <button
                onClick={() => handleCheckout(PRICE_MONTHLY)}
                disabled={!!checkoutLoading}
                className="w-full py-3 rounded-2xl bg-foreground text-background text-[15px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-60"
              >
                {checkoutLoading === PRICE_MONTHLY ? 'Opening…' : 'Monthly — €7.99/month'}
              </button>
              <button
                onClick={() => handleCheckout(PRICE_YEARLY)}
                disabled={!!checkoutLoading}
                className="w-full py-3 rounded-2xl border border-border text-foreground text-[15px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-60"
              >
                {checkoutLoading === PRICE_YEARLY ? 'Opening…' : 'Yearly — €69.99/year'}
              </button>
              {checkoutError && (
                <p className="text-xs text-destructive leading-snug px-1 pt-1">
                  Error: {checkoutError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Account Settings */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">Account</h3>
          <div className="flow-card-flat space-y-1 p-2">
            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Email</p>
                  <p className="text-sm text-muted-foreground">{user?.email ?? 'No email registered'}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Change Password</p>
                  <p className="text-sm text-muted-foreground">Update your password</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">Preferences</h3>
          <div className="flow-card-flat space-y-1 p-2">
            {/* Theme */}
            <button 
              onClick={toggleDarkMode}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  {settings.theme === 'dark' ? <Moon className="w-5 h-5 text-muted-foreground" /> : <Sun className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Theme</p>
                  <p className="text-sm text-muted-foreground">{settings.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
                </div>
              </div>
              <div className={cn('w-12 h-7 rounded-full transition-all duration-300 flex items-center border', settings.theme === 'dark' ? 'bg-primary/20 border-primary/40' : 'bg-muted border-border')}>
                <div className={cn('w-5 h-5 rounded-full transition-all duration-300', settings.theme === 'dark' ? 'ml-6 bg-primary' : 'ml-1 bg-muted-foreground/40')} />
              </div>
            </button>
          </div>
        </div>

        {/* Categories & Folders - Section Wise */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">Categories & Folders</h3>
          <div className="space-y-2">
            {/* Calendar Categories */}
            <div className="flow-card-flat p-2">
              <button
                onClick={() => toggleSection('calendar')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Calendar Categories</p>
                    <p className="text-sm text-muted-foreground">{eventCategories.length} categories</p>
                  </div>
                </div>
                {expandedSection === 'calendar' ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
              </button>

              {expandedSection === 'calendar' && (
                <div className="mt-2 space-y-1 animate-fade-in">
                  {eventCategories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-secondary">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-4 h-4 rounded-full', `bg-pastel-${cat.color}`)} />
                        <span className="font-medium text-foreground">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => openEditDrawer('calendar', cat.id, cat.name, cat.color)}
                          className="p-1.5 rounded-lg hover:bg-muted"
                        >
                          <Edit3 className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem('calendar', cat.id)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => openAddDrawer('calendar')}
                    className="w-full text-center py-2 rounded-xl text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                  >
                    Add New Category
                  </button>
                </div>
              )}
            </div>

            {/* Tasks Categories */}
            <div className="flow-card-flat p-2">
              <button
                onClick={() => toggleSection('tasks')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <CheckSquare className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Tasks Lists</p>
                    <p className="text-sm text-muted-foreground">{taskCategories.length} lists</p>
                  </div>
                </div>
                {expandedSection === 'tasks' ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
              </button>

              {expandedSection === 'tasks' && (
                <div className="mt-2 space-y-1 animate-fade-in">
                  {[...taskCategories]
                    .sort((a, b) => (a.isDefault ? 1 : 0) - (b.isDefault ? 1 : 0))
                    .map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-secondary">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-4 h-4 rounded-full', `bg-pastel-${cat.color}`)} />
                        <span className="font-medium text-foreground">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditDrawer('tasks', cat.id, cat.name, cat.color, cat.isDefault)}
                          className="p-1.5 rounded-lg hover:bg-muted"
                        >
                          <Edit3 className="w-4 h-4 text-muted-foreground" />
                        </button>
                        {!cat.isDefault && (
                          <button
                            onClick={() => handleDeleteItem('tasks', cat.id)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => openAddDrawer('tasks')}
                    className="w-full text-center py-2 rounded-xl text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                  >
                    Add New List
                  </button>
                </div>
              )}
            </div>

            {/* Notes Folders */}
            <div className="flow-card-flat p-2">
              <button
                onClick={() => toggleSection('notes')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <Folder className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Notes Folders</p>
                    <p className="text-sm text-muted-foreground">{folders.length} folders</p>
                  </div>
                </div>
                {expandedSection === 'notes' ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
              </button>

              {expandedSection === 'notes' && (
                <div className="mt-2 space-y-1 animate-fade-in">
                  {folders.map((folder) => (
                    <div key={folder.id} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-secondary">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-4 h-4 rounded-full', `bg-pastel-${folder.color}`)} />
                        <span className="font-medium text-foreground">{folder.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => openEditDrawer('notes', folder.id, folder.name, folder.color)}
                          className="p-1.5 rounded-lg hover:bg-muted"
                        >
                          <Edit3 className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem('notes', folder.id)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => openAddDrawer('notes')}
                    className="w-full text-center py-2 rounded-xl text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                  >
                    Add New Folder
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">Support</h3>
          <div className="flow-card-flat space-y-1 p-2">
            <button
              onClick={() => window.open('#', '_blank')}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Help & FAQ</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              onClick={() => window.open('#', '_blank')}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <MessageSquareDot className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Feedback & Roadmap</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Legal */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">Legal</h3>
          <div className="flow-card-flat space-y-1 p-2">
            <button
              onClick={() => window.open('#', '_blank')}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Privacy Policy</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              onClick={() => window.open('#', '_blank')}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Terms of Service</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={() => { void signOut(); }}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-destructive/10 text-destructive font-medium"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>

        {/* DEV ONLY — remove before launch */}
        <button
          onClick={async () => {
            await supabase.auth.updateUser({ data: { onboarding_completed: false } });
            window.location.reload();
          }}
          className="w-full p-3 rounded-2xl border border-dashed border-muted-foreground/30 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          Reset onboarding (dev only)
        </button>

        <p className="text-center text-sm text-muted-foreground">Planisa v1.0.0</p>
      </div>

      {/* Edit Profile Modal */}
      {showAvatarModal && ReactDOM.createPortal(
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              background: 'rgba(0,0,0,0.3)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
            onClick={() => setShowAvatarModal(false)}
          />

          {/* Modal */}
          <div
            style={{
              position: 'fixed',
              top: modalTop,
              left: 0,
              right: 0,
              zIndex: 9999,
              padding: '0 20px',
            }}
          >
            <div
              className="bg-card rounded-3xl shadow-2xl animate-scale-in"
              style={{ maxHeight, overflowY: 'auto' }}
            >
              {/* Sticky header */}
              <div className="sticky top-0 bg-card rounded-t-3xl flex items-center justify-between px-5 pt-5 pb-3 z-10">
                <h2 className="text-lg font-semibold text-foreground">Edit Profile</h2>
                <button
                  onClick={() => setShowAvatarModal(false)}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="px-5 pb-5">
                {/* Avatar preview */}
                <div className="flex justify-center mb-5">
                  <div
                    className={cn('w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold', getAccentTextClass(avatarColor))}
                    style={{ backgroundColor: `hsl(var(--pastel-${avatarColor}))` }}
                  >
                    {avatarInitial || '?'}
                  </div>
                </div>

                {/* Name */}
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your name"
                  className="flow-input mb-4 w-full"
                />

                {/* Initials */}
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Initials (1–2 chars)</label>
                <input
                  type="text"
                  value={avatarInitial}
                  onChange={(e) => setAvatarInitial(e.target.value.slice(0, 2).toUpperCase())}
                  placeholder="e.g. MO"
                  className="flow-input mb-4 w-full text-center tracking-widest"
                  maxLength={2}
                />

                {/* Color */}
                <p className="text-sm font-medium text-muted-foreground mb-2">Color</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {pastelColors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setAvatarColor(c.value)}
                      className={cn(
                        'w-10 h-10 rounded-xl transition-all duration-200',
                        c.class,
                        avatarColor === c.value
                          ? 'ring-2 ring-offset-2 ring-primary scale-110'
                          : 'hover:scale-105',
                      )}
                      aria-label={c.label}
                    />
                  ))}
                </div>

                <button onClick={handleSaveAvatar} className="w-full flow-button-primary">
                  Save
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body,
      )}

      {/* Add Category/Folder Drawer */}
      <CategoryEditDrawer
        isOpen={showAddDrawer}
        onClose={() => setShowAddDrawer(false)}
        title={`New ${addDrawerSection === 'notes' ? 'Folder' : addDrawerSection === 'tasks' ? 'List' : 'Category'}`}
        itemName={newItemName}
        itemColor={newItemColor}
        onNameChange={setNewItemName}
        onColorChange={setNewItemColor}
        onSave={handleAddItem}
        placeholder={addDrawerSection === 'notes' ? 'Folder name' : addDrawerSection === 'tasks' ? 'List name' : 'Category name'}
        saveLabel={`Create ${addDrawerSection === 'notes' ? 'Folder' : addDrawerSection === 'tasks' ? 'List' : 'Category'}`}
      />

      {/* Edit Category/Folder Drawer */}
      <CategoryEditDrawer
        isOpen={showEditDrawer}
        onClose={() => setShowEditDrawer(false)}
        title={`Edit ${editItemSection === 'notes' ? 'Folder' : editItemSection === 'tasks' ? 'List' : 'Category'}`}
        itemName={editItemName}
        itemColor={editItemColor}
        onNameChange={setEditItemName}
        onColorChange={setEditItemColor}
        onSave={handleUpdateItem}
        onDelete={() => editItemId && handleDeleteItem(editItemSection, editItemId)}
        placeholder={editItemSection === 'notes' ? 'Folder name' : editItemSection === 'tasks' ? 'List name' : 'Category name'}
        saveLabel="Save Changes"
        showDelete={!editItemIsDefault}
        hideNameInput={editItemIsDefault}
      />
    </div>
  );
}
