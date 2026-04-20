import { useState } from 'react';
import { 
  Mail, 
  Lock, 
  Globe, 
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
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { pastelColors } from '@/lib/colors';
import { PastelColor } from '@/types';
import { CategoryEditDrawer } from '@/components/modals/CategoryEditDrawer';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { useAuth } from '@/contexts/AuthContext';

type Language = 'en' | 'sv';
type CategorySection = 'calendar' | 'tasks' | 'notes' | 'notebooks';

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
    deleteFolder,
    notebooks,
    addNotebook,
    updateNotebook,
    deleteNotebook
  } = useAppStore();

  const [showLanguageSelect, setShowLanguageSelect] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarInitial, setAvatarInitial] = useState(settings.avatarInitial || 'U');
  const [avatarColor, setAvatarColor] = useState<PastelColor>(settings.avatarColor || 'sky');
  const [userName, setUserName] = useState(settings.name || '');

  // Section-wise category management
  const [expandedSection, setExpandedSection] = useState<CategorySection | null>('calendar');
  
  // Add new category/folder drawer
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [addDrawerSection, setAddDrawerSection] = useState<CategorySection>('calendar');
  const [newItemName, setNewItemName] = useState('');
  const [newItemColor, setNewItemColor] = useState<PastelColor>('sky');

  // Edit category/folder drawer
  const [showEditDrawer, setShowEditDrawer] = useState(false);
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
    updateSettings({ avatarInitial: avatarInitial, avatarColor: avatarColor, name: userName.trim() });
    setShowAvatarModal(false);
  };

  const openAddDrawer = (section: CategorySection) => {
    setAddDrawerSection(section);
    setNewItemName('');
    setNewItemColor('sky');
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
      case 'notebooks':
        addNotebook({ name: newItemName.trim(), color: newItemColor });
        break;
    }
    
    setNewItemName('');
    setShowAddDrawer(false);
  };

  const openEditDrawer = (section: CategorySection, id: string, name: string, color: PastelColor) => {
    setEditItemSection(section);
    setEditItemId(id);
    setEditItemName(name);
    setEditItemColor(color);
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
      case 'notebooks':
        updateNotebook(editItemId, { name: editItemName.trim(), color: editItemColor });
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
      case 'notebooks':
        deleteNotebook(id);
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
                  <div className="w-10 h-10 rounded-xl bg-pastel-sky flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-pastel-sky-accent" />
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
                  <div className="w-10 h-10 rounded-xl bg-pastel-mint flex items-center justify-center">
                    <CheckSquare className="w-5 h-5 text-pastel-mint-accent" />
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
                  {taskCategories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-secondary">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-4 h-4 rounded-full', `bg-pastel-${cat.color}`)} />
                        <span className="font-medium text-foreground">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => openEditDrawer('tasks', cat.id, cat.name, cat.color)}
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
                  <div className="w-10 h-10 rounded-xl bg-pastel-lavender flex items-center justify-center">
                    <Folder className="w-5 h-5 text-pastel-lavender-accent" />
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

            {/* Notebooks */}
            <div className="flow-card-flat p-2">
              <button
                onClick={() => toggleSection('notebooks')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pastel-coral flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-pastel-coral-accent" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Notebooks</p>
                    <p className="text-sm text-muted-foreground">{notebooks.length} notebooks</p>
                  </div>
                </div>
                {expandedSection === 'notebooks' ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
              </button>

              {expandedSection === 'notebooks' && (
                <div className="mt-2 space-y-1 animate-fade-in">
                  {notebooks.map((notebook) => (
                    <div key={notebook.id} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-secondary">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-4 h-4 rounded-full', `bg-pastel-${notebook.color}`)} />
                        <span className="font-medium text-foreground">{notebook.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => openEditDrawer('notebooks', notebook.id, notebook.name, notebook.color)}
                          className="p-1.5 rounded-lg hover:bg-muted"
                        >
                          <Edit3 className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem('notebooks', notebook.id)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => openAddDrawer('notebooks')}
                    className="w-full text-center py-2 rounded-xl text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                  >
                    Add New Notebook
                  </button>
                </div>
              )}
            </div>
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

        <p className="text-center text-sm text-muted-foreground">Flow Planner v1.0.0</p>
      </div>

      {/* Avatar Drawer */}
      <Drawer open={showAvatarModal} onOpenChange={(open) => !open && setShowAvatarModal(false)}>
        <DrawerContent className="max-h-[85vh]">
          <div className="mx-auto w-full max-w-lg">
            <DrawerHeader className="pb-2">
              <div className="flex items-center justify-between">
                <DrawerTitle className="text-lg font-semibold">Edit Profile</DrawerTitle>
                <button 
                  onClick={() => setShowAvatarModal(false)} 
                  className="p-2 rounded-full bg-secondary hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </DrawerHeader>

            <div className="px-4 pb-2">
              {/* Preview */}
              <div className="text-center mb-4">
                <div className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto',
                  `bg-pastel-${avatarColor}/30 text-pastel-${avatarColor}`
                )}>
                  {avatarInitial}
                </div>
              </div>

              {/* Name Input */}
              <div className="mb-4">
                <label className="text-sm font-medium text-muted-foreground mb-2 block text-center">Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your name"
                  className="flow-input text-center"
                />
              </div>

              {/* Initial Input */}
              <input
                type="text"
                value={avatarInitial}
                onChange={(e) => setAvatarInitial(e.target.value.slice(0, 2).toUpperCase())}
                placeholder="Initial (1-2 characters)"
                className="flow-input mb-4 text-center"
                maxLength={2}
              />

              {/* Color Selection */}
              <div className="mb-4">
                <p className="text-sm font-medium text-muted-foreground mb-2 text-center">Color</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {pastelColors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setAvatarColor(c.value)}
                      className={cn(
                        'w-10 h-10 rounded-xl transition-all duration-200',
                        c.class,
                        avatarColor === c.value 
                          ? 'ring-2 ring-offset-2 ring-primary scale-110' 
                          : 'hover:scale-105'
                      )}
                      aria-label={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <DrawerFooter className="pt-2">
              <button onClick={handleSaveAvatar} className="w-full flow-button-primary">
                Save
              </button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Add Category/Folder/Notebook Drawer */}
      <CategoryEditDrawer
        isOpen={showAddDrawer}
        onClose={() => setShowAddDrawer(false)}
        title={`New ${addDrawerSection === 'notes' ? 'Folder' : addDrawerSection === 'notebooks' ? 'Notebook' : addDrawerSection === 'tasks' ? 'List' : 'Category'}`}
        itemName={newItemName}
        itemColor={newItemColor}
        onNameChange={setNewItemName}
        onColorChange={setNewItemColor}
        onSave={handleAddItem}
        placeholder={addDrawerSection === 'notes' ? 'Folder name' : addDrawerSection === 'notebooks' ? 'Notebook name' : addDrawerSection === 'tasks' ? 'List name' : 'Category name'}
        saveLabel={`Create ${addDrawerSection === 'notes' ? 'Folder' : addDrawerSection === 'notebooks' ? 'Notebook' : addDrawerSection === 'tasks' ? 'List' : 'Category'}`}
      />

      {/* Edit Category/Folder/Notebook Drawer */}
      <CategoryEditDrawer
        isOpen={showEditDrawer}
        onClose={() => setShowEditDrawer(false)}
        title={`Edit ${editItemSection === 'notes' ? 'Folder' : editItemSection === 'notebooks' ? 'Notebook' : editItemSection === 'tasks' ? 'List' : 'Category'}`}
        itemName={editItemName}
        itemColor={editItemColor}
        onNameChange={setEditItemName}
        onColorChange={setEditItemColor}
        onSave={handleUpdateItem}
        onDelete={() => editItemId && handleDeleteItem(editItemSection, editItemId)}
        placeholder={editItemSection === 'notes' ? 'Folder name' : editItemSection === 'notebooks' ? 'Notebook name' : editItemSection === 'tasks' ? 'List name' : 'Category name'}
        saveLabel="Save Changes"
        showDelete={true}
      />
    </div>
  );
}
