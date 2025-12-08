import { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Globe, 
  Moon, 
  Sun,
  ChevronRight,
  ChevronDown,
  LogOut,
  Plus,
  X,
  Folder,
  Calendar,
  CheckSquare,
  Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { pastelColors } from '@/lib/colors';
import { PastelColor } from '@/types';

type Language = 'en' | 'sv';
type CategorySection = 'calendar' | 'tasks' | 'notes';

const languages: { value: Language; label: string; native: string }[] = [
  { value: 'en', label: 'English', native: 'English' },
  { value: 'sv', label: 'Swedish', native: 'Svenska' },
];

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
    deleteFolder
  } = useAppStore();

  const [showLanguageSelect, setShowLanguageSelect] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarInitial, setAvatarInitial] = useState(settings.avatarInitial || 'U');
  const [avatarColor, setAvatarColor] = useState<PastelColor>(settings.avatarColor || 'sky');

  // Section-wise category management
  const [expandedSection, setExpandedSection] = useState<CategorySection | null>('calendar');
  
  // Add new category/folder modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalSection, setAddModalSection] = useState<CategorySection>('calendar');
  const [newItemName, setNewItemName] = useState('');
  const [newItemColor, setNewItemColor] = useState<PastelColor>('sky');

  // Edit category/folder modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editItemSection, setEditItemSection] = useState<CategorySection>('calendar');
  const [editItemName, setEditItemName] = useState('');
  const [editItemColor, setEditItemColor] = useState<PastelColor>('sky');

  const toggleDarkMode = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
    document.documentElement.classList.toggle('dark');
  };

  const handleSaveAvatar = () => {
    updateSettings({ avatarInitial: avatarInitial, avatarColor: avatarColor });
    setShowAvatarModal(false);
  };

  const openAddModal = (section: CategorySection) => {
    setAddModalSection(section);
    setNewItemName('');
    setNewItemColor('sky');
    setShowAddModal(true);
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    
    switch (addModalSection) {
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
    setShowAddModal(false);
  };

  const openEditModal = (section: CategorySection, id: string, name: string, color: PastelColor) => {
    setEditItemSection(section);
    setEditItemId(id);
    setEditItemName(name);
    setEditItemColor(color);
    setShowEditModal(true);
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
    
    setShowEditModal(false);
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
                  <div className="w-10 h-10 rounded-xl bg-pastel-sky/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-pastel-sky" />
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
                          onClick={() => openEditModal('calendar', cat.id, cat.name, cat.color)}
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
                    onClick={() => openAddModal('calendar')}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-primary hover:bg-secondary transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Add Category</span>
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
                  <div className="w-10 h-10 rounded-xl bg-pastel-mint/20 flex items-center justify-center">
                    <CheckSquare className="w-5 h-5 text-pastel-mint" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Tasks Categories</p>
                    <p className="text-sm text-muted-foreground">{taskCategories.length} categories</p>
                  </div>
                </div>
                {expandedSection === 'tasks' ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
              </button>

              {expandedSection === 'tasks' && (
                <div className="mt-2 space-y-1 animate-fade-in">
                  {taskCategories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-secondary">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-4 h-4 rounded-full', `bg-pastel-${cat.color}`)} />
                        <span className="font-medium text-foreground">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => openEditModal('tasks', cat.id, cat.name, cat.color)}
                          className="p-1.5 rounded-lg hover:bg-muted"
                        >
                          <Edit3 className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem('tasks', cat.id)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => openAddModal('tasks')}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-primary hover:bg-secondary transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Add Category</span>
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
                  <div className="w-10 h-10 rounded-xl bg-pastel-lavender/20 flex items-center justify-center">
                    <Folder className="w-5 h-5 text-pastel-lavender" />
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
                          onClick={() => openEditModal('notes', folder.id, folder.name, folder.color)}
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
                    onClick={() => openAddModal('notes')}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-primary hover:bg-secondary transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Add Folder</span>
                  </button>
                </div>
              )}
            </div>
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

      {/* Add Category/Folder Modal */}
      {showAddModal && (
        <>
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40" onClick={() => setShowAddModal(false)} />
          <div className="fixed inset-x-4 bottom-0 z-50 flow-bottom-sheet animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                New {addModalSection === 'notes' ? 'Folder' : 'Category'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-full bg-secondary">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={addModalSection === 'notes' ? 'Folder name' : 'Category name'}
              className="flow-input mb-4"
              autoFocus
            />
            <div className="flex flex-wrap gap-2 mb-4">
              {pastelColors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setNewItemColor(c.value)}
                  className={cn('w-8 h-8 rounded-full transition-all', c.class, newItemColor === c.value && 'ring-2 ring-offset-2 ring-primary')}
                />
              ))}
            </div>
            <button 
              onClick={handleAddItem} 
              disabled={!newItemName.trim()}
              className="w-full flow-button-primary disabled:opacity-50"
            >
              Create {addModalSection === 'notes' ? 'Folder' : 'Category'}
            </button>
          </div>
        </>
      )}

      {/* Edit Category/Folder Modal */}
      {showEditModal && (
        <>
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40" onClick={() => setShowEditModal(false)} />
          <div className="fixed inset-x-4 bottom-0 z-50 flow-bottom-sheet animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Edit {editItemSection === 'notes' ? 'Folder' : 'Category'}
              </h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 rounded-full bg-secondary">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <input
              type="text"
              value={editItemName}
              onChange={(e) => setEditItemName(e.target.value)}
              placeholder={editItemSection === 'notes' ? 'Folder name' : 'Category name'}
              className="flow-input mb-4"
              autoFocus
            />
            <div className="flex flex-wrap gap-2 mb-4">
              {pastelColors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setEditItemColor(c.value)}
                  className={cn('w-8 h-8 rounded-full transition-all', c.class, editItemColor === c.value && 'ring-2 ring-offset-2 ring-primary')}
                />
              ))}
            </div>
            <button 
              onClick={handleUpdateItem} 
              disabled={!editItemName.trim()}
              className="w-full flow-button-primary disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </>
      )}
    </div>
  );
}
