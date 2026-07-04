import { useState, useRef, useEffect, useCallback, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
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
import { pastelColors, getStickyTextClass } from '@/lib/colors';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { NoteContentPreview } from '@/components/notes/NoteContentPreview';
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
function SortableFolderCard({ folder, onClick, onEdit, isGrid, noteCount }: { folder: Folder; onClick: () => void; onEdit: () => void; isGrid: boolean; noteCount: number }) {
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn('md:touch-none', isGrid && 'md:max-w-[200px] md:w-full')}>
      {isGrid
        ? <FolderGridCard folder={folder} onClick={onClick} onEdit={onEdit} />
        : <FolderListCard folder={folder} count={noteCount} onClick={onClick} onEdit={onEdit} />}
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn('md:touch-none', className)}>
      {children}
    </div>
  );
}

type LayoutMode = 'list' | 'grid';

interface TabsHeaderProps {
  viewTab: ViewTab;
  setViewTab: (tab: ViewTab) => void;
  showFilterMenu: boolean;
  setShowFilterMenu: (v: boolean | ((p: boolean) => boolean)) => void;
  boardsFilter: 'all' | 'notes-only' | 'sticky-only';
  setBoardsFilter: (f: 'all' | 'notes-only' | 'sticky-only') => void;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  foldersLayoutMode: LayoutMode;
  setFoldersLayoutMode: (mode: LayoutMode) => void;
  showSearch: boolean;
  setShowSearch: (v: boolean) => void;
}

function TabsHeader({
  viewTab,
  setViewTab,
  showFilterMenu,
  setShowFilterMenu,
  boardsFilter,
  setBoardsFilter,
  layoutMode,
  setLayoutMode,
  foldersLayoutMode,
  setFoldersLayoutMode,
  showSearch,
  setShowSearch,
}: TabsHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
      {/* Tabs — centered on desktop */}
      <div className="relative z-[300] inline-flex bg-secondary/50 rounded-2xl p-1 gap-0.5 md:col-start-2">
        {(['boards', 'folders'] as ViewTab[]).map((tab) => (
          <button
            key={tab}
            onPointerDown={() => { console.log('folders pointerdown', tab); setViewTab(tab); }}
            style={{ touchAction: 'manipulation' }}
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
                        {f === 'all' ? 'All' : f === 'notes-only' ? 'Notes only' : 'Stickies only'}
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
        {viewTab === 'folders' && (
          <button
            onClick={() => setFoldersLayoutMode(foldersLayoutMode === 'list' ? 'grid' : 'list')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {foldersLayoutMode === 'list' ? <LayoutGrid className="w-4 h-4" /> : <LayoutList className="w-4 h-4" />}
          </button>
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
}

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
  const [foldersLayoutMode, setFoldersLayoutMode] = useState<LayoutMode>(() => (localStorage.getItem('planisa_folders_view') as LayoutMode) || 'grid');
  const [folderInsideLayoutMode, setFolderInsideLayoutMode] = useState<LayoutMode>(() => (localStorage.getItem('planisa_folder_inside_view') as LayoutMode) || 'grid');
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
  const [menuBtnRect, setMenuBtnRect] = useState<DOMRect | null>(null);

  useEffect(() => { localStorage.setItem('boards-view', layoutMode); }, [layoutMode]);
  useEffect(() => { localStorage.setItem('boards-filter', boardsFilter); }, [boardsFilter]);
  useEffect(() => { localStorage.setItem('planisa_folders_view', foldersLayoutMode); }, [foldersLayoutMode]);
  useEffect(() => { localStorage.setItem('planisa_folder_inside_view', folderInsideLayoutMode); }, [folderInsideLayoutMode]);

  // Drag-and-drop sensors for folder reordering
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 400, tolerance: 8 } }),
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

  const handleCloseEditor = useCallback(() => {
    setSelectedNote(null);
    setSelectedStickyNote(null);
    setIsCreatingStickyNote(false);
    onEditingChange?.(false);
    onCloseEditor?.();
    setShouldScrollToTop(true);
  }, [onEditingChange, onCloseEditor]);

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

    const hasContent = note.content && note.content.replace(/<[^>]*>/g, '').trim().length > 0;
    const fadeColor = isSticky && note.color
      ? `hsl(var(--pastel-${note.color}))`
      : 'hsl(var(--card))';

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
      <div className={cn(
        "relative group",
        isMenuOpen && "z-[1000]",
        // List view: promote card styles to the wrapper so the right column
        // (··· / folder / date) can live outside the <button> as a sibling.
        !isGrid && cn(cardBgClass, "rounded-2xl shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] transition-all duration-200 flex items-stretch")
      )}>
        <button
          onClick={() => handleOpenNote(note)}
          className={cn(
            'text-left transition-all duration-200 active:scale-[0.98]',
            isGrid
              ? cn('w-full rounded-2xl p-4', cardBgClass, 'h-[140px] md:h-44 overflow-hidden', 'shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)]')
              : 'flex-1 p-4 min-w-0'
          )}
        >
          {isGrid ? (
            /* Grid layout: content top, folder+date bottom row — unchanged */
            <div className="flex flex-col h-full">
              <div className="flex-1 min-w-0 min-h-0 overflow-hidden relative">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0 overflow-hidden pr-5">
                    {hasContent ? (
                      <NoteContentPreview content={note.content} />
                    ) : (
                      <p className="flow-card-title">{note.title || 'Empty note'}</p>
                    )}
                  </div>
                  {note.isPinned && (
                    <Pin className="w-4 h-4 text-[#6B6B6B] flex-shrink-0 mt-0.5" />
                  )}
                </div>
                <div
                  className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none"
                  style={{ background: `linear-gradient(to bottom, transparent, ${fadeColor})` }}
                />
              </div>
              <div className="flex-shrink-0 flex items-center justify-between gap-2 mt-auto md:mt-0 pt-3">
                {note.folder ? (
                  <span className={cn('flow-badge', folderData ? `bg-pastel-${folderData.color}` : 'bg-pastel-flamingo', getStickyTextClass(folderData?.color))}>
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
            /* List layout: left content only — right column lives outside this button */
            <div className="flex items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-1.5">
                  {note.isPinned && (
                    <Pin className="w-4 h-4 text-[#6B6B6B] flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0 max-h-[3.5rem] overflow-hidden relative">
                    {hasContent ? (
                      <NoteContentPreview content={note.content} />
                    ) : (
                      <p className="flow-card-title truncate">{note.title || 'Empty note'}</p>
                    )}
                    <div
                      className="absolute left-0 right-0 bottom-0 pointer-events-none"
                      style={{ top: '1.5rem', background: `linear-gradient(to bottom, transparent, ${fadeColor})` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </button>

        {/* Right column — list view only. Sibling of the card button so we can
            stack ··· above the label and date without nesting <button> in <button>. */}
        {!isGrid && (
          <div className="flex flex-col items-end flex-shrink-0 pt-2 pr-2 pb-3 pl-2 gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); if (!isMenuOpen) setMenuBtnRect(e.currentTarget.getBoundingClientRect()); setOpenMenuNoteId(isMenuOpen ? null : note.id); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center md:bg-black/5 md:hover:bg-black/10 dark:md:bg-white/10 dark:md:hover:bg-white/20 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
              aria-label="Note options"
            >
              <MoreHorizontal className="w-4 h-4 text-foreground/60" />
            </button>
            {note.folder && (
              <span className={cn('flow-badge', folderData ? `bg-pastel-${folderData.color}` : 'bg-pastel-flamingo', getStickyTextClass(folderData?.color))}>
                {note.folder}
              </span>
            )}
            {!note.hideDate && (
              <span className="flow-meta-sm">
                {format(new Date(note.date || note.updatedAt), 'MMM d')}
              </span>
            )}
          </div>
        )}

        {/* ··· menu button — grid view only (absolutely positioned) */}
        {isGrid && (
          <button
            onClick={(e) => { e.stopPropagation(); if (!isMenuOpen) setMenuBtnRect(e.currentTarget.getBoundingClientRect()); setOpenMenuNoteId(isMenuOpen ? null : note.id); }}
            className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center md:bg-black/5 md:hover:bg-black/10 dark:md:bg-white/10 dark:md:hover:bg-white/20 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
            aria-label="Note options"
          >
            <MoreHorizontal className="w-4 h-4 text-foreground/60" />
          </button>
        )}

        {/* Dropdown menu — rendered in a portal so it is never clipped by
            overflow:hidden on card wrappers or buried under sibling cards. */}
        {isMenuOpen && menuBtnRect && createPortal(
          <>
            <div className="fixed inset-0 z-[200]" onClick={() => setOpenMenuNoteId(null)} />
            <div
              className="fixed z-[201] bg-card rounded-xl border border-border/50 p-1 min-w-[130px]"
              style={{
                top: menuBtnRect.bottom + 4,
                right: window.innerWidth - menuBtnRect.right,
                boxShadow: 'var(--shadow-elevated)',
              }}
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
          </>,
          document.body
        )}
      </div>
    );
  };

  // Show editors
  if (selectedNote || (isCreatingNew && !externalIsCreatingStickyNote)) {
    return <NoteEditor note={selectedNote?.id ? selectedNote : undefined} onClose={handleCloseEditor} defaultFolder={selectedFolder?.name} debugSource="NotesView" />;
  }

  if (selectedStickyNote || isCreatingStickyNote || (isCreatingNew && externalIsCreatingStickyNote)) {
    return <StickyNoteEditor note={selectedStickyNote || undefined} onClose={handleCloseEditor} showCalendarToggle defaultFolder={selectedFolder?.name} />;
  }

  // Inside folder view - separate from tabs
  if (selectedFolder) {
    // isInSubfolder is computed above (before sort computations)

    const folderInsideToggleEl = (
      <button
        onClick={() => setFolderInsideLayoutMode(folderInsideLayoutMode === 'list' ? 'grid' : 'list')}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        {folderInsideLayoutMode === 'list' ? <LayoutGrid className="w-4 h-4" /> : <LayoutList className="w-4 h-4" />}
      </button>
    );

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
            <div className="flex items-center gap-1 flex-shrink-0">
              {folderInsideToggleEl}
              {sortMenuEl}
            </div>
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
              <h1 className="flow-page-title truncate">{selectedFolder.name}</h1>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {folderInsideToggleEl}
              {sortMenuEl}
            </div>
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
              strategy={folderInsideLayoutMode === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
            >
              <div className={cn('px-4 py-2', folderInsideLayoutMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6' : 'space-y-2')}>
                {sortedFolderItems.map(item => (
                  <SortableNoteItem key={item.id} id={item.id}>
                    {item.kind === 'subfolder'
                      ? folderInsideLayoutMode === 'grid'
                        ? <FolderGridCard folder={item.folder} onClick={() => { setParentFolder(selectedFolder); setSelectedFolder(item.folder); }} onEdit={() => setEditModalFolder(item.folder)} compact />
                        : <FolderListCard folder={item.folder} count={notes.filter(n => n.folder === item.folder.name).length} onClick={() => { setParentFolder(selectedFolder); setSelectedFolder(item.folder); }} onEdit={() => setEditModalFolder(item.folder)} />
                      : item.note.type === 'sticky'
                        ? <StickyNoteCard note={item.note} onClick={() => handleOpenNote(item.note)} isGrid={folderInsideLayoutMode === 'grid'} />
                        : <NoteCard note={item.note} isGrid={folderInsideLayoutMode === 'grid'} />}
                  </SortableNoteItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className={cn('px-4 py-2', folderInsideLayoutMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6' : 'space-y-2')}>
            {sortedFolderItems.map(item => (
              item.kind === 'subfolder'
                ? folderInsideLayoutMode === 'grid'
                  ? <FolderGridCard key={item.id} folder={item.folder} onClick={() => { setParentFolder(selectedFolder); setSelectedFolder(item.folder); }} onEdit={() => setEditModalFolder(item.folder)} />
                  : <FolderListCard key={item.id} folder={item.folder} count={notes.filter(n => n.folder === item.folder.name).length} onClick={() => { setParentFolder(selectedFolder); setSelectedFolder(item.folder); }} onEdit={() => setEditModalFolder(item.folder)} />
                : item.note.type === 'sticky'
                  ? <StickyNoteCard key={item.id} note={item.note} onClick={() => handleOpenNote(item.note)} isGrid={folderInsideLayoutMode === 'grid'} />
                  : <NoteCard key={item.id} note={item.note} isGrid={folderInsideLayoutMode === 'grid'} />
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

  // Folders view - macOS style icons
  if (viewTab === 'folders') {
    return (
      <div className="min-h-screen pb-24 pt-safe-2">
        <div className="px-6 pb-4">
          <TabsHeader
            viewTab={viewTab}
            setViewTab={setViewTab}
            showFilterMenu={showFilterMenu}
            setShowFilterMenu={setShowFilterMenu}
            boardsFilter={boardsFilter}
            setBoardsFilter={setBoardsFilter}
            layoutMode={layoutMode}
            setLayoutMode={setLayoutMode}
            foldersLayoutMode={foldersLayoutMode}
            setFoldersLayoutMode={setFoldersLayoutMode}
            showSearch={showSearch}
            setShowSearch={setShowSearch}
          />

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
            <SortableContext
              items={rootFolders.map((f) => f.id)}
              strategy={foldersLayoutMode === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
            >
              <div
                className={foldersLayoutMode === 'grid'
                  ? 'grid grid-cols-2 md:grid-cols-4 md:justify-items-center gap-4 md:gap-10 p-4'
                  : 'space-y-2'}
                style={foldersLayoutMode === 'grid' ? { margin: '-16px' } : undefined}
              >
                {rootFolders.map((folder) => (
                  <SortableFolderCard
                    key={folder.id}
                    folder={folder}
                    onClick={() => setSelectedFolder(folder)}
                    onEdit={() => setEditModalFolder(folder)}
                    isGrid={foldersLayoutMode === 'grid'}
                    noteCount={notes.filter(n => n.folder === folder.name).length}
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
    <div className="pb-24 pt-safe-2">
      <div className="px-4 pb-4">
        <TabsHeader
          viewTab={viewTab}
          setViewTab={setViewTab}
          showFilterMenu={showFilterMenu}
          setShowFilterMenu={setShowFilterMenu}
          boardsFilter={boardsFilter}
          setBoardsFilter={setBoardsFilter}
          layoutMode={layoutMode}
          setLayoutMode={setLayoutMode}
          foldersLayoutMode={foldersLayoutMode}
          setFoldersLayoutMode={setFoldersLayoutMode}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
        />

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
