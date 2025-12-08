import { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Globe, 
  Palette, 
  Moon, 
  Sun,
  ChevronRight,
  LogOut,
  Tag,
  Plus,
  X,
  Folder
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { pastelColors } from '@/lib/colors';
import { PastelColor } from '@/types';

type Language = 'en' | 'sv';

const languages: { value: Language; label: string; native: string }[] = [
  { value: 'en', label: 'English', native: 'English' },
  { value: 'sv', label: 'Swedish', native: 'Svenska' },
];

export function ProfileView() {
  const { settings, updateSettings, categories, addCategory, deleteCategory, folders } = useAppStore();
  const [showLanguageSelect, setShowLanguageSelect] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState<PastelColor>('sky');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarInitial, setAvatarInitial] = useState(settings.avatarInitial || 'U');
  const [avatarColor, setAvatarColor] = useState<PastelColor>(settings.avatarColor || 'sky');

  const toggleDarkMode = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
    document.documentElement.classList.toggle('dark');
  };

  const handleSaveAvatar = () => {
    updateSettings({ avatarInitial: avatarInitial, avatarColor: avatarColor });
    setShowAvatarModal(false);
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addCategory({ name: newCategoryName.trim(), color: newCategoryColor, type: 'both' });
      setNewCategoryName('');
      setShowCategoryModal(false);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 py-4 space-y-6">
        {/* User Info Card */}
        <div className="flow-card">
          <button onClick={() => setShowAvatarModal(true)} className="flex items-center gap-4 w-full text-left">
            <div className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold',
              `bg-pastel-${settings.avatarColor}/30 text-pastel-${settings.avatarColor}`
            )}>
              {settings.avatarInitial || 'U'}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Flow Planner User</h3>
              <p className="text-sm text-muted-foreground">user@example.com</p>
              <span className="text-xs text-muted-foreground">Tap to edit profile</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
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
                  <p className="text-sm text-muted-foreground">user@example.com</p>
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
            {/* Language */}
            <div>
              <button 
                onClick={() => setShowLanguageSelect(!showLanguageSelect)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Language</p>
                    <p className="text-sm text-muted-foreground">
                      {languages.find(l => l.value === settings.language)?.native}
                    </p>
                  </div>
                </div>
                <ChevronRight className={cn('w-5 h-5 text-muted-foreground transition-transform', showLanguageSelect && 'rotate-90')} />
              </button>

              {showLanguageSelect && (
                <div className="mt-2 ml-16 space-y-1 animate-fade-in">
                  {languages.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => {
                        updateSettings({ language: lang.value });
                        setShowLanguageSelect(false);
                      }}
                      className={cn(
                        'w-full text-left px-4 py-2 rounded-xl transition-colors text-sm',
                        settings.language === lang.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary hover:bg-muted text-muted-foreground'
                      )}
                    >
                      {lang.native}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
              <div className={cn('w-12 h-7 rounded-full transition-all duration-300 relative', settings.theme === 'dark' ? 'bg-primary' : 'bg-muted')}>
                <div className={cn('absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-300', settings.theme === 'dark' ? 'left-6' : 'left-1')} />
              </div>
            </button>
          </div>
        </div>

        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-semibold text-muted-foreground">Categories</h3>
            <button onClick={() => setShowCategoryModal(true)} className="text-primary text-sm font-medium">+ Add</button>
          </div>
          <div className="flow-card-flat p-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className={cn('w-4 h-4 rounded-full', `bg-pastel-${cat.color}`)} />
                  <span className="font-medium text-foreground">{cat.name}</span>
                </div>
                <button onClick={() => deleteCategory(cat.id)} className="text-muted-foreground hover:text-destructive">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sign Out */}
        <button className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-destructive/10 text-destructive font-medium">
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>

        <p className="text-center text-sm text-muted-foreground">Flow Planner v1.0.0</p>
      </div>

      {/* Avatar Modal */}
      {showAvatarModal && (
        <>
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40" onClick={() => setShowAvatarModal(false)} />
          <div className="fixed inset-x-4 bottom-0 z-50 flow-bottom-sheet animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Profile</h3>
              <button onClick={() => setShowAvatarModal(false)} className="p-2 rounded-full bg-secondary">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="text-center mb-4">
              <div className={cn('w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto', `bg-pastel-${avatarColor}/30 text-pastel-${avatarColor}`)}>
                {avatarInitial}
              </div>
            </div>
            <input
              type="text"
              value={avatarInitial}
              onChange={(e) => setAvatarInitial(e.target.value.slice(0, 2).toUpperCase())}
              placeholder="Initial (1-2 characters)"
              className="flow-input mb-4 text-center"
              maxLength={2}
            />
            <div className="flex flex-wrap gap-2 mb-4 justify-center">
              {pastelColors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setAvatarColor(c.value)}
                  className={cn('w-8 h-8 rounded-full transition-all', c.class, avatarColor === c.value && 'ring-2 ring-offset-2 ring-primary')}
                />
              ))}
            </div>
            <button onClick={handleSaveAvatar} className="w-full flow-button-primary">Save</button>
          </div>
        </>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <>
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40" onClick={() => setShowCategoryModal(false)} />
          <div className="fixed inset-x-4 bottom-0 z-50 flow-bottom-sheet animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">New Category</h3>
              <button onClick={() => setShowCategoryModal(false)} className="p-2 rounded-full bg-secondary">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name"
              className="flow-input mb-4"
            />
            <div className="flex flex-wrap gap-2 mb-4">
              {pastelColors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setNewCategoryColor(c.value)}
                  className={cn('w-8 h-8 rounded-full transition-all', c.class, newCategoryColor === c.value && 'ring-2 ring-offset-2 ring-primary')}
                />
              ))}
            </div>
            <button onClick={handleAddCategory} className="w-full flow-button-primary">Create Category</button>
          </div>
        </>
      )}
    </div>
  );
}