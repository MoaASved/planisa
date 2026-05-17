import { useState, useRef, useEffect, CSSProperties } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import {
  FolderOpen,
  FolderPlus,
  ChevronRight,
  Pin,
  LayoutGrid,
  LayoutList,
  X,
  Search,
  BookOpen,
  Plus,
  ArrowLeft,
  MoreHorizontal,
  SlidersHorizontal,
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
import { FolderGridCard } from '@/components/notes/FolderGridCard';
import { FolderEditModal } from '@/components/notes/FolderEditModal';
import { NotebookView } from '@/components/notes/NotebookView';
import { NotebookActionSheet } from '@/components/notes/NotebookActionSheet';
import { NotebookEditModal } from '@/components/notes/NotebookEditModal';
import { useHaptics } from '@/hooks/useHaptics';


type ViewTab = 'folders' | 'boards' | 'notebooks';

// ── Sortable folder card (used in Folders tab drag-and-drop) ──────────────────
function SortableFolderCard({ folder, onClick, onEdit }: { folder: Folder; onClick: () => void; onEdit: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: folder.id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    scale: isDragging ? '1.05' : undefined,
    boxShadow: isDragging ? '0 12px 32px rgba(0,0,0,0.18)' : undefined,
    opacity: isDragging ? 0.92 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none md:max-w-[200px] md:w-full">
      <FolderGridCard folder={folder} onClick={onClick} onEdit={onEdit} />
    </div>
  );
}
type LayoutMode = 'list' | 'grid';

interface NotesViewProps {
  onEditingChange?: (isEditing: boolean) => void;
  isCreatingNew?: boolean;
  isCreatingStickyNote?: boolean;
  onCloseEditor?: () => void;
  initialNoteId?: string;
  onInitialNoteConsumed?: () => void;
  initialNotebookPage?: { notebookId: string; pageId: string };
  onInitialNotebookPageConsumed?: () => void;
}

export function NotesView({ onEditingChange, isCreatingNew, isCreatingStickyNote: externalIsCreatingStickyNote, onCloseEditor, initialNoteId, onInitialNoteConsumed, initialNotebookPage, onInitialNotebookPageConsumed }: NotesViewProps) {
  const { notes, folders, notebooks, addFolder, addNotebook, updateNotebook, deleteNotebook, searchQuery, setSearchQuery, reorderFolders } = useAppStore();
  const haptics = useHaptics();
  const [viewTab, setViewTab] = useState<ViewTab>('folders');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => (localStorage.getItem('boards-view') as LayoutMode) || 'grid');
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedStickyNote, setSelectedStickyNote] = useState<Note | null>(null);
  const [isCreatingStickyNote, setIsCreatingStickyNote] = useState(false);
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);
  const [boardsFilter, setBoardsFilter] = useState<'all' | 'notes-only' | 'sticky-only'>(() => (localStorage.getItem('boards-filter') as 'all' | 'notes-only' | 'sticky-only') || 'all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState<PastelColor>('peony');
  const [newNotebookName, setNewNotebookName] = useState('');
  const [newNotebookColor, setNewNotebookColor] = useState<PastelColor>('rose');
  const [showSearch, setShowSearch] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToTop, setShouldScrollToTop] = useState(false);
  
  // Notebook action sheet state
  const [actionSheetNotebook, setActionSheetNotebook] = useState<Notebook | null>(null);
  const [showNotebookActions, setShowNotebookActions] = useState(false);
  const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null);
  const [editModalNotebook, setEditModalNotebook] = useState<Notebook | null>(null);
  const [editModalFolder, setEditModalFolder] = useState<Folder | null>(null);

  const [pendingPageId, setPendingPageId] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem('boards-view', layoutMode); }, [layoutMode]);
  useEffect(() => { localStorage.setItem('boards-filter', boardsFilter); }, [boardsFilter]);

  // Navigate to a specific notebook page when initialNotebookPage is provided
  useEffect(() => {
    if (!initialNotebookPage) return;
    const nb = notebooks.find(n => n.id === initialNotebookPage.notebookId);
    if (nb) {
      setViewTab('notebooks');
      setSelectedNotebook(nb);
      setPendingPageId(initialNotebookPage.pageId);
      onInitialNotebookPageConsumed?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNotebookPage]);

  // Drag-and-drop sensors for folder reordering
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const handleFolderDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = folders.findIndex((f) => f.id === active.id);
    const newIndex = folders.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(folders, oldIndex, newIndex);
    reorderFolders(newOrder.map((f) => f.id));
  };

  // Scroll to top when editor closes
  useEffect(() => {
    if (shouldScrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setShouldScrollToTop(false);
    }
  }, [shouldScrollToTop]);

  // Open a specific note when navigated from a focus card tap
  useEffect(() => {
    if (!initialNoteId) return;
    const note = notes.find(n => n.id === initialNoteId);
    if (!note) return;
    if (note.type === 'sticky') {
      setSelectedStickyNote(note);
    } else {
      setSelectedNote(note);
      onEditingChange?.(true);
    }
    onInitialNoteConsumed?.();
  }, []); // intentionally runs once on mount

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

  const filteredBoardsNotes = filteredAllNotes.filter(note => {
    if (boardsFilter === 'notes-only') return note.type !== 'sticky';
    if (boardsFilter === 'sticky-only') return note.type === 'sticky';
    return true;
  });

  // Notes in selected folder (both regular and sticky)
  const folderNotes = selectedFolder 
    ? notes.filter(n => n.folder === selectedFolder.name)
    : [];

  const parseNoteContent = (html: string): { header: string; preview: string } => {
    if (!html || html.trim() === '') return { header: '', preview: '' };
    const withBreaks = html
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    const lines = withBreaks.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return { header: '', preview: '' };
    return { header: lines[0], preview: lines.slice(1).join('\n') };
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
      ? `bg-[hsl(var(--pastel-${note.color}))]`
      : 'bg-card border border-black/[0.04]';

    const { header, preview } = parseNoteContent(note.content);

    return (
      <button
        onClick={() => handleOpenNote(note)}
        className={cn(
          'text-left group transition-all duration-200 w-full rounded-2xl p-4',
          cardBgClass,
          isGrid && 'min-h-[140px]',
          'shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] active:scale-[0.98]'
        )}
      >
        {isGrid ? (
          /* Grid layout: star top-right, title+preview top-left, folder+date bottom row */
          <div className="flex flex-col h-full">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                {header && <h4 className="flow-card-title">{header}</h4>}
                {note.isPinned && (
                  <Pin className="w-4 h-4 text-[#6B6B6B] flex-shrink-0" />
                )}
              </div>
              {preview && (
                <p className="text-[13px] text-muted-foreground mt-1 leading-snug whitespace-pre-line line-clamp-4">
                  {preview}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 mt-auto pt-3">
              {note.folder ? (
                <span className={cn('flow-badge', folderData ? `bg-pastel-${folderData.color}` : 'bg-pastel-taupe', 'text-foreground/75')}>
                  {note.folder}
                </span>
              ) : <span />}
              <span className="flow-meta-sm">
                {format(new Date(note.date || note.updatedAt), 'MMM d')}
              </span>
            </div>
          </div>
        ) : (
          /* List layout: star+title left, folder+date right-aligned column */
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              {(header || note.isPinned) && (
                <div className="flex items-center gap-1.5">
                  {note.isPinned && (
                    <Pin className="w-4 h-4 text-[#6B6B6B] flex-shrink-0" />
                  )}
                  {header && <h4 className="flow-card-title truncate">{header}</h4>}
                </div>
              )}
              {preview && (
                <p className="text-[13px] text-muted-foreground mt-1 leading-snug whitespace-pre-line line-clamp-2">
                  {preview}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {note.folder && (
                <span className={cn('flow-badge', folderData ? `bg-pastel-${folderData.color}` : 'bg-pastel-taupe', 'text-foreground/75')}>
                  {note.folder}
                </span>
              )}
              <span className="flow-meta-sm">
                {format(new Date(note.date || note.updatedAt), 'MMM d')}
              </span>
            </div>
          </div>
        )}
      </button>
    );
  };

  // Show editors
  if (selectedNote || (isCreatingNew && !externalIsCreatingStickyNote)) {
    return <NoteEditor note={selectedNote?.id ? selectedNote : undefined} onClose={handleCloseEditor} defaultFolder={selectedFolder?.name} />;
  }

  if (selectedStickyNote || isCreatingStickyNote || (isCreatingNew && externalIsCreatingStickyNote)) {
    return <StickyNoteEditor note={selectedStickyNote || undefined} onClose={handleCloseEditor} showCalendarToggle defaultFolder={selectedFolder?.name} />;
  }

  if (selectedNotebook) {
    return (
      <NotebookView
        notebook={selectedNotebook}
        onClose={() => setSelectedNotebook(null)}
        initialPageId={pendingPageId ?? undefined}
        onInitialPageConsumed={() => setPendingPageId(null)}
      />
    );
  }

  // Inside folder view - separate from tabs
  if (selectedFolder) {
    return (
      <div className="min-h-screen pb-24 pt-safe-2">
        {/* Header with back button */}
        <div className="flex items-center gap-3 px-4 pb-3">
          <button 
            onClick={() => setSelectedFolder(null)}
            className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <FolderOpen className="w-5 h-5" style={{ color: `hsl(var(--pastel-${selectedFolder.color}-accent))` }} />
          <h1 className="flow-page-title">{selectedFolder.name}</h1>
        </div>

        {/* Notes in folder */}
        <div className={cn('px-4 py-2', layoutMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-3' : 'space-y-2')}>
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

  // Navigation tabs - left-aligned with action icons on the right
  const TabsHeader = () => (
    <div className="flex items-center justify-between mb-4 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
      {/* Tabs — centered on desktop */}
      <div className="inline-flex bg-secondary/50 rounded-2xl p-1 gap-0.5 md:col-start-2">
        {(['folders', 'boards', 'notebooks'] as ViewTab[]).map((tab) => (
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
            {tab === 'folders' ? 'Folders' : tab === 'boards' ? 'Boards' : 'Notebooks'}
          </button>
        ))}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 md:col-start-3 md:justify-self-end">
        {viewTab === 'boards' && (
          <>
            {/* Filter */}
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(v => !v)}
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                  showFilterMenu || boardsFilter !== 'all'
                    ? 'text-foreground bg-secondary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <SlidersHorizontal className="w-4 h-4" />
                {boardsFilter !== 'all' && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary pointer-events-none" />
                )}
              </button>
              {showFilterMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
                  <div
                    className="absolute right-0 top-full mt-1 z-20 bg-card rounded-xl border border-border/50 p-1 min-w-[140px]"
                    style={{ boxShadow: 'var(--shadow-elevated)' }}
                  >
                    {(['all', 'notes-only', 'sticky-only'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => { setBoardsFilter(f); setShowFilterMenu(false); }}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                          boardsFilter === f
                            ? 'bg-secondary text-foreground font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                        )}
                      >
                        {f === 'all' ? 'All' : f === 'notes-only' ? 'Notes only' : 'Sticky only'}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* View toggle */}
            <button
              onClick={() => setLayoutMode(layoutMode === 'list' ? 'grid' : 'list')}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              {layoutMode === 'list' ? <LayoutGrid className="w-4 h-4" /> : <LayoutList className="w-4 h-4" />}
            </button>
          </>
        )}
        {/* Search */}
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
      <div className="min-h-screen pb-24 pt-safe-2">
        <div className="px-4 pb-4">
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

          <div className="grid grid-cols-2 md:grid-cols-4 md:justify-items-center gap-4 md:gap-8 p-4" style={{ margin: '-16px' }}>
            {notebooks.map((notebook, index) => (
              <div
                key={notebook.id}
                className="stagger-item md:max-w-[200px] md:w-full"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <NotebookCard 
                  notebook={notebook} 
                  onClick={() => setSelectedNotebook(notebook)}
                  onEdit={() => setEditModalNotebook(notebook)}
                />
              </div>
            ))}
          </div>

          {/* FAB for creating new notebook */}
          <div className="fixed bottom-[144px] right-4 z-[1100]">
            <button
              onClick={() => { setEditingNotebook(null); setNewNotebookName(''); setNewNotebookColor('rose'); setShowNotebookModal(true); }}
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
              <div className="bg-card rounded-[20px] p-6 animate-scale-in" style={{ boxShadow: 'var(--shadow-elevated)' }}>
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

  // Folders view - macOS style icons
  if (viewTab === 'folders') {
    return (
      <div className="min-h-screen pb-24 pt-safe-2">
        <div className="px-4 pb-4">
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

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFolderDragEnd}>
            <SortableContext items={folders.map((f) => f.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 md:grid-cols-4 md:justify-items-center gap-4 md:gap-8 p-4" style={{ margin: '-16px' }}>
                {folders.map((folder) => (
                  <SortableFolderCard
                    key={folder.id}
                    folder={folder}
                    onClick={() => setSelectedFolder(folder)}
                    onEdit={() => setEditModalFolder(folder)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>


          {folders.length === 0 && (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No folders yet</p>
            </div>
          )}
        </div>

        {/* FAB for creating new folder */}
        <div className="fixed bottom-[144px] md:bottom-8 right-4 z-[1100]">
          <button
            onClick={() => setShowFolderModal(true)}
            className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 bg-primary"
          >
            <Plus className="w-6 h-6 text-primary-foreground" />
          </button>
        </div>

        {showFolderModal && (
          <>
            <div 
              className="fixed inset-0 z-[1100] animate-fade-in"
              style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
              onClick={() => setShowFolderModal(false)} 
            />
            <div className="fixed z-[9999]" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'calc(100% - 48px)', maxWidth: 400 }}>
              <div className="bg-card rounded-[20px] p-6 animate-scale-in" style={{ boxShadow: 'var(--shadow-elevated)' }}>
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
            </div>
          </>
        )}

        {/* Folder Edit Modal */}
        {editModalFolder && (
          <FolderEditModal
            folder={editModalFolder}
            onClose={() => setEditModalFolder(null)}
          />
        )}

      </div>
    );
  }

  // Boards view (default) - all notes and sticky notes
  return (
    <div className="min-h-screen pb-24 pt-safe-2">
      <div className="px-4 pb-4">
        <TabsHeader />

        {showSearch && (
          <div className="mb-4 animate-fade-in">
            <input
              type="text"
              placeholder="Search boards..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="w-full flow-input"
            />
          </div>
        )}

        <div className={cn(layoutMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-3' : 'space-y-3')}>
          {filteredBoardsNotes.map((note, index) => (
            <div key={note.id} className="stagger-item" style={{ animationDelay: `${index * 40}ms` }}>
              {note.type === 'sticky'
                ? <StickyNoteCard note={note} onClick={() => handleOpenNote(note)} isGrid={layoutMode === 'grid'} />
                : <NoteCard note={note} isGrid={layoutMode === 'grid'} />
              }
            </div>
          ))}
        </div>

        {filteredBoardsNotes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {boardsFilter === 'notes-only' ? 'No notes yet' : boardsFilter === 'sticky-only' ? 'No sticky notes yet' : 'No boards yet'}
            </p>
          </div>
        )}
      </div>

      
    </div>
  );
}
