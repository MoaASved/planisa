import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  FolderOpen, 
  FolderPlus,
  ChevronRight,
  Star,
  LayoutGrid,
  LayoutList,
  X,
  Search,
  BookOpen,
  Plus,
  ArrowLeft,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { Note, PastelColor, Notebook, Folder } from '@/types';
import { pastelColors } from '@/lib/colors';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { StickyNoteCard } from '@/components/notes/StickyNoteCard';
import { StickyNoteEditor } from '@/components/notes/StickyNoteEditor';
import { NotebookCard } from '@/components/notes/NotebookCard';
import { NotebookListCard } from '@/components/notes/NotebookListCard';
import { FolderListCard } from '@/components/notes/FolderListCard';
import { NotebookView } from '@/components/notes/NotebookView';
import { NotebookActionSheet } from '@/components/notes/NotebookActionSheet';
import { NotebookEditModal } from '@/components/notes/NotebookEditModal';
import { useHaptics } from '@/hooks/useHaptics';


type ViewTab = 'notes' | 'folders' | 'sticky' | 'notebooks';
type LayoutMode = 'list' | 'grid';

interface NotesViewProps {
  onEditingChange?: (isEditing: boolean) => void;
  isCreatingNew?: boolean;
  isCreatingStickyNote?: boolean;
  onCloseEditor?: () => void;
}

export function NotesView({ onEditingChange, isCreatingNew, isCreatingStickyNote: externalIsCreatingStickyNote, onCloseEditor }: NotesViewProps) {
  const { notes, folders, notebooks, addFolder, addNotebook, updateNotebook, deleteNotebook, searchQuery, setSearchQuery } = useAppStore();
  const haptics = useHaptics();
  const [viewTab, setViewTab] = useState<ViewTab>('notes');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedStickyNote, setSelectedStickyNote] = useState<Note | null>(null);
  const [isCreatingStickyNote, setIsCreatingStickyNote] = useState(false);
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState<PastelColor>('sky');
  const [newNotebookName, setNewNotebookName] = useState('');
  const [newNotebookColor, setNewNotebookColor] = useState<PastelColor>('lavender');
  const [showSearch, setShowSearch] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToTop, setShouldScrollToTop] = useState(false);
  
  // Notebook action sheet state
  const [actionSheetNotebook, setActionSheetNotebook] = useState<Notebook | null>(null);
  const [showNotebookActions, setShowNotebookActions] = useState(false);
  const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null);
  const [editModalNotebook, setEditModalNotebook] = useState<Notebook | null>(null);

  // Scroll to top when editor closes
  useEffect(() => {
    if (shouldScrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setShouldScrollToTop(false);
    }
  }, [shouldScrollToTop]);

  // Get all notes and sticky notes
  const allNotes = notes.filter(n => !n.hideFromAllNotes);
  const stickyNotes = notes.filter(n => n.type === 'sticky');

  // Filter notes based on search
  const filteredAllNotes = allNotes.filter(note => {
    if (!localSearchQuery) return true;
    const query = localSearchQuery.toLowerCase();
    return note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query);
  }).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const filteredStickyNotes = stickyNotes.filter(note => {
    if (!localSearchQuery) return true;
    const query = localSearchQuery.toLowerCase();
    return note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query);
  });

  // Notes in selected folder (both regular and sticky)
  const folderNotes = selectedFolder 
    ? notes.filter(n => n.folder === selectedFolder.name)
    : [];

  const getPreview = (content: string) => {
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    return plainText.slice(0, 100) + (plainText.length > 100 ? '...' : '');
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      addFolder({ name: newFolderName.trim(), color: newFolderColor });
      setNewFolderName('');
      setShowFolderModal(false);
    }
  };

  const handleCreateNotebook = () => {
    if (newNotebookName.trim()) {
      addNotebook({ name: newNotebookName.trim(), color: newNotebookColor });
      setNewNotebookName('');
      setShowNotebookModal(false);
    }
  };

  // Notebook action handlers
  const handleNotebookLongPress = (notebook: Notebook) => {
    haptics.medium();
    setActionSheetNotebook(notebook);
    setShowNotebookActions(true);
  };

  const handleDeleteNotebook = () => {
    if (actionSheetNotebook) {
      deleteNotebook(actionSheetNotebook.id);
      haptics.error();
      setActionSheetNotebook(null);
    }
  };

  const handleEditNotebook = () => {
    if (actionSheetNotebook) {
      setEditingNotebook(actionSheetNotebook);
      setNewNotebookName(actionSheetNotebook.name);
      setNewNotebookColor(actionSheetNotebook.color);
      setShowNotebookModal(true);
    }
  };

  const handleSaveNotebook = () => {
    if (editingNotebook && newNotebookName.trim()) {
      updateNotebook(editingNotebook.id, { name: newNotebookName.trim(), color: newNotebookColor });
      setEditingNotebook(null);
      setNewNotebookName('');
      setShowNotebookModal(false);
    } else if (newNotebookName.trim()) {
      addNotebook({ name: newNotebookName.trim(), color: newNotebookColor });
      setNewNotebookName('');
      setShowNotebookModal(false);
    }
  };

  const handleOpenNote = (note: Note) => {
    if (note.type === 'sticky') {
      setSelectedStickyNote(note);
    } else {
      setSelectedNote(note);
      onEditingChange?.(true);
    }
  };

  const handleCloseEditor = () => {
    setSelectedNote(null);
    setSelectedStickyNote(null);
    setIsCreatingStickyNote(false);
    onEditingChange?.(false);
    onCloseEditor?.();
    setShouldScrollToTop(true);
  };

  const handleCreateNote = () => {
    setSelectedNote({ id: '', title: '', content: '', type: 'note', tags: [], createdAt: new Date(), updatedAt: new Date(), isPinned: false } as Note);
    onEditingChange?.(true);
  };

  const handleCreateStickyNote = () => {
    setIsCreatingStickyNote(true);
  };

  // Note card component - NO color for regular notes
  const NoteCard = ({ note, isGrid }: { note: Note; isGrid: boolean }) => {
    const folderData = folders.find(f => f.name === note.folder);
    const isSticky = note.type === 'sticky';
    
    // Only sticky notes get color
    const cardBgClass = isSticky && note.color
      ? `bg-[hsl(var(--pastel-${note.color})/0.3)]`
      : 'bg-card border border-border';
    
    return (
      <button
        onClick={() => handleOpenNote(note)}
        className={cn(
          'text-left group transition-all duration-200 w-full rounded-2xl p-4',
          cardBgClass,
          isGrid && 'min-h-[140px]',
          'shadow-sm hover:shadow-md active:scale-[0.98]'
        )}
      >
        <div className={cn('flex', isGrid ? 'flex-col h-full' : 'items-start justify-between')}>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-foreground truncate">
                {note.title || 'Untitled'}
              </h4>
              {note.isPinned && (
                <Star className="w-4 h-4 text-[#6B6B6B] flex-shrink-0" fill="currentColor" />
              )}
            </div>
            <p className={cn('text-sm text-muted-foreground mt-1', isGrid ? 'line-clamp-4' : 'line-clamp-2')}>
              {getPreview(note.content)}
            </p>
          </div>
          
          <div className={cn('flex items-center gap-2 flex-wrap', isGrid ? 'mt-auto pt-3' : 'mt-2')}>
            {note.folder && (
              <span className={cn('flow-badge', folderData ? `flow-badge-${folderData.color}` : 'flow-badge-gray')}>
                {note.folder}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {format(new Date(note.date || note.updatedAt), 'MMM d')}
            </span>
          </div>
          
          {!isGrid && (
            <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
          )}
        </div>
      </button>
    );
  };

  // Show editors
  if (selectedNote || (isCreatingNew && !externalIsCreatingStickyNote)) {
    return <NoteEditor note={selectedNote?.id ? selectedNote : undefined} onClose={handleCloseEditor} />;
  }

  if (selectedStickyNote || isCreatingStickyNote || (isCreatingNew && externalIsCreatingStickyNote)) {
    return <StickyNoteEditor note={selectedStickyNote || undefined} onClose={handleCloseEditor} />;
  }

  if (selectedNotebook) {
    return <NotebookView notebook={selectedNotebook} onClose={() => setSelectedNotebook(null)} />;
  }

  // Inside folder view - separate from tabs
  if (selectedFolder) {
    return (
      <div className="min-h-screen pb-24">
        {/* Header with back button */}
        <div className="flex items-center gap-3 px-4 py-3">
          <button 
            onClick={() => setSelectedFolder(null)}
            className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <FolderOpen className={`w-5 h-5 text-[hsl(var(--pastel-${selectedFolder.color}))]`} />
          <h1 className="font-semibold text-lg">{selectedFolder.name}</h1>
        </div>

        {/* Notes in folder */}
        <div className={cn('px-4 py-2', layoutMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-2')}>
          {folderNotes.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-muted-foreground">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No notes in this folder</p>
            </div>
          ) : (
            folderNotes.map(note => (
              note.type === 'sticky' 
                ? <StickyNoteCard key={note.id} note={note} onClick={() => handleOpenNote(note)} isGrid={layoutMode === 'grid'} />
                : <NoteCard key={note.id} note={note} isGrid={layoutMode === 'grid'} />
            ))
          )}
        </div>

      </div>
    );
  }

  // Navigation tabs - centered with smooth button styling
  const TabsHeader = () => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex-1" />
      
      {/* Centered navigation tabs */}
      <div className="inline-flex bg-secondary/50 rounded-2xl p-1 gap-0.5">
        {(['notes', 'folders', 'sticky', 'notebooks'] as ViewTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setViewTab(tab)}
            className={cn(
              'px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95',
              viewTab === tab 
                ? 'bg-card shadow-sm text-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab === 'notes' ? 'Notes' : tab === 'folders' ? 'Folders' : tab === 'sticky' ? 'Sticky' : 'Notebooks'}
          </button>
        ))}
      </div>

      {/* Right controls */}
      <div className="flex-1 flex justify-end gap-2">
        <button
          onClick={() => setLayoutMode(layoutMode === 'list' ? 'grid' : 'list')}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          {layoutMode === 'list' ? <LayoutGrid className="w-4 h-4" /> : <LayoutList className="w-4 h-4" />}
        </button>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
            showSearch ? 'text-foreground bg-secondary' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // Notebooks view - macOS style icons
  if (viewTab === 'notebooks') {
    return (
      <div className="min-h-screen pb-24">
        <div className="px-4 py-4">
          <TabsHeader />
          
          {showSearch && (
            <div className="mb-4 animate-fade-in">
              <input
                type="text"
                placeholder="Search notebooks..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="w-full flow-input"
              />
            </div>
          )}

          <div className={cn(
            layoutMode === 'grid' 
              ? 'grid grid-cols-2 gap-4 p-4' 
              : 'space-y-2 px-4'
          )} style={{ margin: layoutMode === 'grid' ? '-16px' : undefined }}>
            {notebooks.map((notebook, index) => (
              <div 
                key={notebook.id} 
                className="stagger-item" 
                style={{ animationDelay: `${index * 40}ms` }}
              >
                {layoutMode === 'grid' ? (
                  <NotebookCard 
                    notebook={notebook} 
                    onClick={() => setSelectedNotebook(notebook)}
                    onEdit={() => setEditModalNotebook(notebook)}
                  />
                ) : (
                  <NotebookListCard 
                    notebook={notebook} 
                    onClick={() => setSelectedNotebook(notebook)}
                    onEdit={() => setEditModalNotebook(notebook)}
                  />
                )}
              </div>
            ))}
          </div>

          {/* FAB for creating new notebook */}
          <div className="fixed bottom-[120px] right-4 z-[1100]">
            <button
              onClick={() => { setEditingNotebook(null); setNewNotebookName(''); setNewNotebookColor('lavender'); setShowNotebookModal(true); }}
              className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 bg-primary"
            >
              <Plus className="w-6 h-6 text-primary-foreground" />
            </button>
          </div>

          {notebooks.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No notebooks yet</p>
            </div>
          )}
        </div>

        {showNotebookModal && (
          <>
            <div 
              className="fixed inset-0 z-[1100] animate-fade-in"
              style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
              onClick={() => { setShowNotebookModal(false); setEditingNotebook(null); }} 
            />
            <div className="fixed z-[9999]" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'calc(100% - 48px)', maxWidth: 400 }}>
              <div className="bg-card rounded-[20px] shadow-xl p-6 animate-scale-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{editingNotebook ? 'Edit Notebook' : 'New Notebook'}</h3>
                  <button onClick={() => { setShowNotebookModal(false); setEditingNotebook(null); }} className="p-2 rounded-full bg-secondary">
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                <input type="text" value={newNotebookName} onChange={(e) => setNewNotebookName(e.target.value)} placeholder="Notebook name" className="flow-input mb-4" />
                <div className="flex flex-wrap gap-2 mb-4">
                  {pastelColors.map((c) => (
                    <button key={c.value} onClick={() => setNewNotebookColor(c.value)} className={cn('w-8 h-8 rounded-full transition-all', c.class, newNotebookColor === c.value && 'ring-2 ring-offset-2 ring-primary')} />
                  ))}
                </div>
                <button onClick={handleSaveNotebook} className="w-full flow-button-primary">{editingNotebook ? 'Save Changes' : 'Create Notebook'}</button>
              </div>
            </div>
          </>
        )}

        {/* Notebook Action Sheet */}
        <NotebookActionSheet
          notebook={actionSheetNotebook}
          open={showNotebookActions}
          onOpenChange={setShowNotebookActions}
          onEdit={handleEditNotebook}
          onDelete={handleDeleteNotebook}
        />

        {/* Edit Notebook Modal (from three-dot menu) */}
        {editModalNotebook && (
          <NotebookEditModal
            notebook={editModalNotebook}
            onClose={() => setEditModalNotebook(null)}
          />
        )}

      </div>
    );
  }

  // Sticky notes view
  if (viewTab === 'sticky') {
    return (
      <div className="min-h-screen pb-24">
        <div className="px-4 py-4">
          <TabsHeader />
          
          {showSearch && (
            <div className="mb-4 animate-fade-in">
              <input
                type="text"
                placeholder="Search sticky notes..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="w-full flow-input"
              />
            </div>
          )}

          <div className={cn(layoutMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3')}>
            {filteredStickyNotes.map((note, index) => (
              <div key={note.id} className="stagger-item" style={{ animationDelay: `${index * 40}ms` }}>
                <StickyNoteCard note={note} onClick={() => handleOpenNote(note)} isGrid={layoutMode === 'grid'} />
              </div>
            ))}
          </div>

          {filteredStickyNotes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No sticky notes yet</p>
            </div>
          )}
        </div>

      </div>
    );
  }

  // Folders view - macOS style icons
  if (viewTab === 'folders') {
    return (
      <div className="min-h-screen pb-24">
        <div className="px-4 py-4">
          <TabsHeader />

          {showSearch && (
            <div className="mb-4 animate-fade-in">
              <input
                type="text"
                placeholder="Search folders..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="w-full flow-input"
              />
            </div>
          )}

          <div className={cn(
            layoutMode === 'grid' 
              ? 'grid grid-cols-3 gap-4' 
              : 'space-y-3'
          )}>
            {folders.map((folder, index) => {
              const count = notes.filter(n => n.folder === folder.name).length;
              return (
                <div 
                  key={folder.id} 
                  className="stagger-item" 
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  {layoutMode === 'grid' ? (
                    <button
                      onClick={() => setSelectedFolder(folder)}
                      className="flex flex-col items-center p-3 rounded-xl transition-all active:scale-95 hover:bg-secondary/30"
                    >
                      {/* macOS style folder icon */}
                      <svg viewBox="0 0 80 64" className="w-16 h-14 mb-2">
                        <path 
                          d="M4 12 L4 60 C4 62 6 64 8 64 L72 64 C74 64 76 62 76 60 L76 16 C76 14 74 12 72 12 L36 12 L32 6 C31 4 29 4 28 4 L8 4 C6 4 4 6 4 8 L4 12 Z" 
                          fill={`hsl(var(--pastel-${folder.color}))`}
                          opacity="0.9"
                        />
                        <path 
                          d="M4 16 L76 16 L76 60 C76 62 74 64 72 64 L8 64 C6 64 4 62 4 60 L4 16 Z" 
                          fill={`hsl(var(--pastel-${folder.color}))`}
                        />
                      </svg>
                      <span className="text-sm font-medium text-center truncate max-w-[80px]">
                        {folder.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {count} {count === 1 ? 'item' : 'items'}
                      </span>
                    </button>
                  ) : (
                    <FolderListCard folder={folder} count={count} onClick={() => setSelectedFolder(folder)} />
                  )}
                </div>
              );
            })}

            {/* Add folder button - adapts to layout */}
            {layoutMode === 'grid' ? (
              <button
                onClick={() => setShowFolderModal(true)}
                className="flex flex-col items-center p-3 rounded-xl transition-all active:scale-95 hover:bg-secondary/30 border-2 border-dashed border-muted-foreground/20"
              >
                <div className="w-16 h-14 mb-2 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">New Folder</span>
              </button>
            ) : (
              <button
                onClick={() => setShowFolderModal(true)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-muted-foreground/20 transition-all active:scale-[0.98] hover:bg-secondary/30"
              >
                <div className="w-12 h-10 rounded-lg flex items-center justify-center bg-secondary/30">
                  <Plus className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <span className="font-medium text-muted-foreground">New Folder</span>
              </button>
            )}
          </div>

          {/* No folder section - adapts to layout */}
          {(() => {
            const noFolderNotes = notes.filter(n => !n.folder);
            if (noFolderNotes.length === 0) return null;
            return (
              <div className="mt-6 pt-4 border-t border-border/50">
                {layoutMode === 'grid' ? (
                  <button
                    onClick={() => setSelectedFolder({ id: '__no_folder__', name: 'No Folder', color: 'gray' } as Folder)}
                    className="flex flex-col items-center p-3 rounded-xl transition-all active:scale-95 hover:bg-secondary/30 opacity-60"
                  >
                    <svg viewBox="0 0 80 64" className="w-16 h-14 mb-2 opacity-50">
                      <path 
                        d="M4 12 L4 60 C4 62 6 64 8 64 L72 64 C74 64 76 62 76 60 L76 16 C76 14 74 12 72 12 L36 12 L32 6 C31 4 29 4 28 4 L8 4 C6 4 4 6 4 8 L4 12 Z" 
                        fill="hsl(var(--muted-foreground))"
                        opacity="0.3"
                      />
                    </svg>
                    <span className="text-sm font-medium text-muted-foreground">No Folder</span>
                    <span className="text-xs text-muted-foreground/70">{noFolderNotes.length} items</span>
                  </button>
                ) : (
                  <FolderListCard 
                    folder={{ id: '__no_folder__', name: 'No Folder', color: 'gray' } as Folder}
                    count={noFolderNotes.length}
                    onClick={() => setSelectedFolder({ id: '__no_folder__', name: 'No Folder', color: 'gray' } as Folder)}
                  />
                )}
              </div>
            );
          })()}
        </div>

        {showFolderModal && (
          <>
            <div className="fixed inset-0 glass-overlay z-40" onClick={() => setShowFolderModal(false)} />
            <div className="fixed inset-x-4 bottom-0 z-50 flow-bottom-sheet glass-modal animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">New Folder</h3>
                <button onClick={() => setShowFolderModal(false)} className="p-2 rounded-full bg-secondary">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Folder name" className="flow-input mb-4" />
              <div className="flex flex-wrap gap-2 mb-4">
                {pastelColors.map((c) => (
                  <button key={c.value} onClick={() => setNewFolderColor(c.value)} className={cn('w-8 h-8 rounded-full transition-all', c.class, newFolderColor === c.value && 'ring-2 ring-offset-2 ring-primary')} />
                ))}
              </div>
              <button onClick={handleCreateFolder} className="w-full flow-button-primary">Create Folder</button>
            </div>
          </>
        )}

      </div>
    );
  }

  // Notes view (default) - all notes and sticky notes, regular notes without color
  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 py-4">
        <TabsHeader />

        {showSearch && (
          <div className="mb-4 animate-fade-in">
            <input
              type="text"
              placeholder="Search notes..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="w-full flow-input"
            />
          </div>
        )}

        <div className={cn(layoutMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3')}>
          {filteredAllNotes.map((note, index) => (
            <div key={note.id} className="stagger-item" style={{ animationDelay: `${index * 40}ms` }}>
              {note.type === 'sticky' 
                ? <StickyNoteCard note={note} onClick={() => handleOpenNote(note)} isGrid={layoutMode === 'grid'} />
                : <NoteCard note={note} isGrid={layoutMode === 'grid'} />
              }
            </div>
          ))}
        </div>

        {filteredAllNotes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No notes yet</p>
          </div>
        )}
      </div>

      
    </div>
  );
}
