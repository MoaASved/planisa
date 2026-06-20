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
  verticalListSortingStrategy,
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
  Plus,
  ArrowLeft,
  MoreHorizontal,
  SlidersHorizontal,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { Note, PastelColor, Folder } from '@/types';
import { pastelColors } from '@/lib/colors';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { StickyNoteCard } from '@/components/notes/StickyNoteCard';
import { StickyNoteEditor } from '@/components/notes/StickyNoteEditor';
import { FolderListCard } from '@/components/notes/FolderListCard';
import { FolderGridCard } from '@/components/notes/FolderGridCard';
import { FolderEditModal } from '@/components/notes/FolderEditModal';
import { useHaptics } from '@/hooks/useHaptics';


type ViewTab = 'folders' | 'boards';
type FolderSortMode = 'custom' | 'edited' | 'alpha' | 'starred';
type FolderItem = { kind: 'subfolder'; id: string; folder: Folder } | { kind: 'note'; id: string; note: Note };

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
// ── Sortable note/sticky item (used inside folder custom-order drag-and-drop) ──
function SortableNoteItem({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.92 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn('touch-none', className)}>
      {children}
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
}

export function NotesView({ onEditingChange, isCreatingNew, isCreatingStickyNote: externalIsCreatingStickyNote, onCloseEditor, initialNoteId, onInitialNoteConsumed }: NotesViewProps) {
  const { notes, folders, addFolder, searchQuery, setSearchQuery, reorderFolders, reorderNotes, updateFolderSortMode, addNote, deleteNote } = useAppStore();
  const haptics = useHaptics();
  const [viewTab, setViewTab] = useState<ViewTab>('boards');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => (localStorage.getItem('boards-view') as LayoutMode) || 'grid');
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [parentFolder, setParentFolder] = useState<Folder | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedStickyNote, setSelectedStickyNote] = useState<Note | null>(null);
  const [isCreatingStickyNote, setIsCreatingStickyNote] = useState(false);
  const [boardsFilter, setBoardsFilter] = useState<'all' | 'notes-only' | 'sticky-only'>(() => (localStorage.getItem('boards-filter') as 'all' | 'notes-only' | 'sticky-only') || 'all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState<PastelColor>('peony');
  const [showSearch, setShowSearch] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToTop, setShouldScrollToTop] = useState(false);
  
  const [editModalFolder, setEditModalFolder] = useState<Folder | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [openMenuNoteId, setOpenMenuNoteId] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem('boards-view', layoutMode); }, [layoutMode]);
  useEffect(() => { localStorage.setItem('boards-filter', boardsFilter); }, [boardsFilter]);

  // Drag-and-drop sensors for folder reordering
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const rootFolders = folders.filter((f) => !f.parentId);

  const handleFolderDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rootFolders.findIndex((f) => f.id === active.id);
    const newIndex = rootFolders.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(rootFolders, oldIndex, newIndex);
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

  // Close sort menu when switching folders
  useEffect(() => {
    setShowSortMenu(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFolder?.id]);

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

  // Whether currently viewing a subfolder (needed for item list + render)
  const isInSubfolder = !!parentFolder;

  // Subfolders of the open folder — excluded when inside a subfolder (no sub-subfolders)
  const currentSubfolders = selectedFolder && !isInSubfolder
    ? folders.filter(f => f.parentId === selectedFolder.id)
    : [];

  // Flat unified item list: subfolders + notes together
  const allFolderItems: FolderItem[] = [
    ...currentSubfolders.map(f => ({ kind: 'subfolder' as const, id: f.id, folder: f })),
    ...folderNotes.map(n => ({ kind: 'note' as const, id: n.id, note: n })),
  ];

  // Sort mode is stored on the folder in Supabase; fall back to 'edited' for new/unset folders
  const folderSortMode: FolderSortMode = (() => {
    if (!selectedFolder) return 'edited';
    const fresh = folders.find(f => f.id === selectedFolder.id);
    return ((fresh?.sortMode ?? selectedFolder.sortMode) as FolderSortMode | undefined) ?? 'edited';
  })();

  const sortedFolderItems: FolderItem[] = (() => {
    if (folderSortMode === 'custom') {
      return [...allFolderItems].sort((a, b) => {
        const posA = a.kind === 'note' ? (a.note.position ?? Infinity) : (a.folder.position ?? Infinity);
        const posB = b.kind === 'note' ? (b.note.position ?? Infinity) : (b.folder.position ?? Infinity);
        return posA - posB;
      });
    }
    if (folderSortMode === 'edited') {
      return [...allFolderItems].sort((a, b) => {
        const tA = a.kind === 'note' ? new Date(a.note.updatedAt).getTime() : 0;
        const tB = b.kind === 'note' ? new Date(b.note.updatedAt).getTime() : 0;
        return tB - tA;
      });
    }
    if (folderSortMode === 'alpha') {
      return [...allFolderItems].sort((a, b) => {
        const nameA = a.kind === 'note' ? a.note.title : a.folder.name;
        const nameB = b.kind === 'note' ? b.note.title : b.folder.name;
        return nameA.localeCompare(nameB, 'sv');
      });
    }
    if (folderSortMode === 'starred') {
      return [...allFolderItems].sort((a, b) => {
        const starA = a.kind === 'note' && a.note.isPinned ? 1 : 0;
        const starB = b.kind === 'note' && b.note.isPinned ? 1 : 0;
        if (starA !== starB) return starB - starA;
        const tA = a.kind === 'note' ? new Date(a.note.updatedAt).getTime() : 0;
        const tB = b.kind === 'note' ? new Date(b.note.updatedAt).getTime() : 0;
        return tB - tA;
      });
    }
    return allFolderItems;
  })();

  const handleSetSortMode = (mode: FolderSortMode) => {
    if (selectedFolder) updateFolderSortMode(selectedFolder.id, mode);
  };

  const handleAllItemsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sortedFolderItems.findIndex(item => item.id === active.id);
    const newIndex = sortedFolderItems.findIndex(item => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(sortedFolderItems, oldIndex, newIndex);
    reorderNotes(newOrder.map(item => ({
      id: item.id,
      type: (item.kind === 'note' ? 'note' : 'folder') as 'note' | 'folder',
    })));
  };

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
      addFolder({
        name: newFolderName.trim(),
        color: newFolderColor,
        ...(selectedFolder ? { parentId: selectedFolder.id } : {}),
      });
      setNewFolderName('');
      setShowFolderModal(false);
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
    const isMenuOpen = openMenuNoteId === note.id;

    // Only sticky notes get color
    const cardBgClass = isSticky && note.color
      ? `bg-[hsl(var(--pastel-${note.color}))]`
      : 'bg-card border border-black/[0.04]';

    const { header, preview } = parseNoteContent(note.content);

    const handleDuplicate = (e: React.MouseEvent) => {
      e.stopPropagation();
      setOpenMenuNoteId(null);
      addNote({
        title: note.title,
        content: note.content,
        type: note.type,
        tags: [...note.tags],
        folder: note.folder,
        color: note.color,
        isPinned: false,
        showInCalendar: note.showInCalendar,
        hideFromAllNotes: note.hideFromAllNotes,
        hideDate: note.hideDate,
      });
    };

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      setOpenMenuNoteId(null);
      deleteNote(note.id);
    };

    return (
      <div className="relative group">
        <button
          onClick={() => handleOpenNote(note)}
          className={cn(
            'text-left transition-all duration-200 w-full rounded-2xl p-4',
            cardBgClass,
            isGrid && 'min-h-[140px] md:h-44 md:overflow-hidden',
            'shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] active:scale-[0.98]'
          )}
        >
          {isGrid ? (
            /* Grid layout: star top-right, title+preview top-left, folder+date bottom row */
            <div className="flex flex-col h-full">
              <div className="flex-1 min-w-0 md:overflow-hidden">
                <div className="flex items-start justify-between gap-2">
                  {header && <h4 className="flow-card-title pr-6">{header}</h4>}
                  {note.isPinned && (
                    <Pin className="w-4 h-4 text-[#6B6B6B] flex-shrink-0" />
                  )}
                </div>
                {preview && (
                  <p className="text-[13px] text-muted-foreground mt-1 leading-snug whitespace-pre-line line-clamp-4 md:line-clamp-3">
                    {preview}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 flex items-center justify-between gap-2 mt-auto md:mt-0 pt-3">
                {note.folder ? (
                  <span className={cn('flow-badge', folderData ? `bg-pastel-${folderData.color}` : 'bg-pastel-flamingo', 'text-[#2C2C2A]')}>
                    {note.folder}
                  </span>
                ) : <span />}
                {!note.hideDate && (
                  <span className="flow-meta-sm">
                    {format(new Date(note.date || note.updatedAt), 'MMM d')}
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* List layout: star+title left, folder+date right-aligned column */
            <div className="flex items-start gap-2 pr-7">
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
                  <span className={cn('flow-badge', folderData ? `bg-pastel-${folderData.color}` : 'bg-pastel-flamingo', 'text-[#2C2C2A]')}>
                    {note.folder}
                  </span>
                )}
                {!note.hideDate && (
                  <span className="flow-meta-sm">
                    {format(new Date(note.date || note.updatedAt), 'MMM d')}
                  </span>
                )}
              </div>
            </div>
          )}
        </button>

        {/* ··· menu button */}
        <button
          onClick={(e) => { e.stopPropagation(); setOpenMenuNoteId(isMenuOpen ? null : note.id); }}
          className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
          aria-label="Note options"
        >
          <MoreHorizontal className="w-4 h-4 text-foreground/60" />
        </button>

        {/* Dropdown menu */}
        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-[200]" onClick={() => setOpenMenuNoteId(null)} />
            <div
              className="absolute top-10 right-2 z-[201] bg-card rounded-xl border border-border/50 p-1 min-w-[130px]"
              style={{ boxShadow: 'var(--shadow-elevated)' }}
            >
              <button
                onClick={handleDuplicate}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-foreground hover:bg-secondary/60 transition-colors"
              >
                Duplicate
              </button>
              <button
                onClick={handleDelete}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-secondary/60 transition-colors"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  // Show editors
  if (selectedNote || (isCreatingNew && !externalIsCreatingStickyNote)) {
    return <NoteEditor note={selectedNote?.id ? selectedNote : undefined} onClose={handleCloseEditor} defaultFolder={selectedFolder?.name} />;
  }

  if (selectedStickyNote || isCreatingStickyNote || (isCreatingNew && externalIsCreatingStickyNote)) {
    return <StickyNoteEditor note={selectedStickyNote || undefined} onClose={handleCloseEditor} showCalendarToggle defaultFolder={selectedFolder?.name} />;
  }

  // Inside folder view - separate from tabs
  if (selectedFolder) {
    // isInSubfolder is computed above (before sort computations)

    const sortMenuEl = (
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setShowSortMenu(v => !v)}
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
            showSortMenu || folderSortMode !== 'edited'
              ? 'text-foreground bg-secondary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <ArrowUpDown className="w-4 h-4" />
        </button>
        {showSortMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
            <div className="absolute right-0 top-full mt-1 z-20 bg-card rounded-xl border border-border/50 p-1 min-w-[160px]" style={{ boxShadow: 'var(--shadow-elevated)' }}>
              {([
                { value: 'custom', label: 'Custom order' },
                { value: 'edited', label: 'Last edited' },
                { value: 'alpha', label: 'Alphabetical' },
                { value: 'starred', label: 'Starred first' },
              ] as { value: FolderSortMode; label: string }[]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { handleSetSortMode(opt.value); setShowSortMenu(false); }}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                    folderSortMode === opt.value
                      ? 'bg-secondary text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );

    return (
      <div className="min-h-screen pb-24 pt-safe-2">
        {/* Header */}
        {isInSubfolder ? (
          <div className="flex items-center justify-between px-4 pb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => { setSelectedFolder(parentFolder); setParentFolder(null); }}
                className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center active:scale-95 transition-all flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <button
                  onClick={() => { setSelectedFolder(null); setParentFolder(null); }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Folders
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <button
                  onClick={() => { setSelectedFolder(parentFolder); setParentFolder(null); }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {parentFolder.name}
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium text-foreground truncate">{selectedFolder.name}</span>
              </div>
            </div>
            {sortMenuEl}
          </div>
        ) : (
          <div className="flex items-center justify-between px-4 pb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => setSelectedFolder(null)}
                className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center active:scale-95 transition-all flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <FolderOpen className="w-5 h-5 flex-shrink-0" style={{ color: `hsl(var(--pastel-${selectedFolder.color}-accent))` }} />
              <h1 className="flow-page-title truncate">{selectedFolder.name}</h1>
            </div>
            {sortMenuEl}
          </div>
        )}

        {/* All items: subfolders + notes sorted together as one flat list */}
        {sortedFolderItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FolderOpen className="w-12 h-12 mb-3 opacity-30" />
            <p>No notes in this folder</p>
          </div>
        ) : folderSortMode === 'custom' ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleAllItemsDragEnd}>
            <SortableContext
              items={sortedFolderItems.map(item => item.id)}
              strategy={layoutMode === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
            >
              <div className={cn('px-4 py-2', layoutMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6' : 'space-y-2')}>
                {sortedFolderItems.map(item => (
                  <SortableNoteItem key={item.id} id={item.id}>
                    {item.kind === 'subfolder'
                      ? layoutMode === 'grid'
                        ? <FolderGridCard folder={item.folder} onClick={() => { setParentFolder(selectedFolder); setSelectedFolder(item.folder); }} onEdit={() => setEditModalFolder(item.folder)} compact />
                        : <FolderListCard folder={item.folder} count={notes.filter(n => n.folder === item.folder.name).length} onClick={() => { setParentFolder(selectedFolder); setSelectedFolder(item.folder); }} />
                      : item.note.type === 'sticky'
                        ? <StickyNoteCard note={item.note} onClick={() => handleOpenNote(item.note)} isGrid={layoutMode === 'grid'} />
                        : <NoteCard note={item.note} isGrid={layoutMode === 'grid'} />}
                  </SortableNoteItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className={cn('px-4 py-2', layoutMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6' : 'space-y-2')}>
            {sortedFolderItems.map(item => (
              item.kind === 'subfolder'
                ? layoutMode === 'grid'
                  ? <FolderGridCard key={item.id} folder={item.folder} onClick={() => { setParentFolder(selectedFolder); setSelectedFolder(item.folder); }} onEdit={() => setEditModalFolder(item.folder)} />
                  : <FolderListCard key={item.id} folder={item.folder} count={notes.filter(n => n.folder === item.folder.name).length} onClick={() => { setParentFolder(selectedFolder); setSelectedFolder(item.folder); }} />
                : item.note.type === 'sticky'
                  ? <StickyNoteCard key={item.id} note={item.note} onClick={() => handleOpenNote(item.note)} isGrid={layoutMode === 'grid'} />
                  : <NoteCard key={item.id} note={item.note} isGrid={layoutMode === 'grid'} />
            ))}
          </div>
        )}

        {/* FAB to create subfolder (only shown in root folder) */}
        {!isInSubfolder && (
          <div className="fixed bottom-[144px] md:bottom-8 right-4 z-[1100]">
            <button
              onClick={() => setShowFolderModal(true)}
              className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 bg-primary"
            >
              <FolderPlus className="w-6 h-6 text-primary-foreground" />
            </button>
          </div>
        )}

        {/* Create subfolder modal */}
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
                  <h3 className="text-lg font-semibold">New Subfolder</h3>
                  <button onClick={() => setShowFolderModal(false)} className="p-2 rounded-full bg-secondary">
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Subfolder name" className="flow-input mb-4" autoFocus />
                <div className="flex flex-wrap gap-2 mb-4">
                  {pastelColors.map((c) => (
                    <button key={c.value} onClick={() => setNewFolderColor(c.value)} className={cn('w-8 h-8 rounded-full transition-all', c.class, newFolderColor === c.value && 'ring-2 ring-offset-2 ring-primary')} />
                  ))}
                </div>
                <button onClick={handleCreateFolder} disabled={!newFolderName.trim()} className="w-full flow-button-primary disabled:opacity-50">Create Subfolder</button>
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

  // Navigation tabs - left-aligned with action icons on the right
  const TabsHeader = () => (
    <div className="flex items-center justify-between mb-4 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
      {/* Tabs — centered on desktop */}
      <div className="inline-flex bg-secondary/50 rounded-2xl p-1 gap-0.5 md:col-start-2">
        {(['boards', 'folders'] as ViewTab[]).map((tab) => (
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
            {tab === 'folders' ? 'Folders' : 'Board'}
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
            <SortableContext items={rootFolders.map((f) => f.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 md:grid-cols-4 md:justify-items-center gap-4 md:gap-8 p-4" style={{ margin: '-16px' }}>
                {rootFolders.map((folder) => (
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


          {rootFolders.length === 0 && (
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
              placeholder="Search board..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="w-full flow-input"
            />
          </div>
        )}

        <div className={cn(layoutMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3' : 'space-y-3')}>
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
              {boardsFilter === 'notes-only' ? 'No notes yet' : boardsFilter === 'sticky-only' ? 'No sticky notes yet' : 'No board items yet'}
            </p>
          </div>
        )}
      </div>

      
    </div>
  );
}
