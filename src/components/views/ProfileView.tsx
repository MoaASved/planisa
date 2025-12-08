import { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Globe, 
  Palette, 
  Layout, 
  Moon, 
  Sun,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/navigation/Header';

type Language = 'en' | 'sv';

const languages: { value: Language; label: string; native: string }[] = [
  { value: 'en', label: 'English', native: 'English' },
  { value: 'sv', label: 'Swedish', native: 'Svenska' },
];

export function ProfileView() {
  const [language, setLanguage] = useState<Language>('en');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showLanguageSelect, setShowLanguageSelect] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="min-h-screen pb-32">
      <Header 
        title="Profile" 
        subtitle="Manage your account" 
      />

      <main className="px-6 py-4 space-y-6">
        {/* User Info Card */}
        <div className="flow-card">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Flow Planner User</h3>
              <p className="text-sm text-muted-foreground">user@example.com</p>
              <span className="text-xs text-muted-foreground">Email & Password</span>
            </div>
          </div>
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
            <div className="relative">
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
                      {languages.find(l => l.value === language)?.native}
                    </p>
                  </div>
                </div>
                <ChevronRight className={cn(
                  'w-5 h-5 text-muted-foreground transition-transform',
                  showLanguageSelect && 'rotate-90'
                )} />
              </button>

              {showLanguageSelect && (
                <div className="mt-2 ml-16 space-y-1 animate-fade-in">
                  {languages.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => {
                        setLanguage(lang.value);
                        setShowLanguageSelect(false);
                      }}
                      className={cn(
                        'w-full text-left px-4 py-2 rounded-xl transition-colors text-sm',
                        language === lang.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary hover:bg-muted text-muted-foreground'
                      )}
                    >
                      {lang.native} ({lang.label})
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
                  {isDarkMode ? (
                    <Moon className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Sun className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Theme</p>
                  <p className="text-sm text-muted-foreground">
                    {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                  </p>
                </div>
              </div>
              <div className={cn(
                'w-12 h-7 rounded-full transition-all duration-300 relative',
                isDarkMode ? 'bg-primary' : 'bg-muted'
              )}>
                <div className={cn(
                  'absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-300',
                  isDarkMode ? 'left-6' : 'left-1'
                )} />
              </div>
            </button>

            {/* Layout Settings Placeholder */}
            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Layout className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Layout Settings</p>
                  <p className="text-sm text-muted-foreground">Customize app layout</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Theme Colors Placeholder */}
            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Palette className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Theme Colors</p>
                  <p className="text-sm text-muted-foreground">Customize colors</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Sign Out */}
        <button className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-destructive/10 text-destructive font-medium hover:bg-destructive/20 transition-colors">
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>

        {/* App Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Flow Planner v1.0.0</p>
        </div>
      </main>
    </div>
  );
}