import { useState } from 'react';
import { format } from 'date-fns';
import { 
  Folder, 
  FolderPlus,
  Pin, 
  ChevronRight,
  Star,
  LayoutGrid,
  LayoutList,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { Note, PastelColor } from '@/types';
import { pastelColors } from '@/lib/colors';
import { NoteEditor } from '@/components/notes/NoteEditor';

type ViewTab = 'all' | 'folders';
type LayoutMode = 'list' | 'grid';

// Color mapping for Post-it style cards (30% opacity)
const getPostItBgClass = (color?: PastelColor): string => {
  if (!color) return 'bg-card border border-border';
  const colorMap: Record<PastelColor, string> = {
    coral: 'bg-pastel-coral/30',
    peach: 'bg-pastel-peach/30',
    amber: 'bg-pastel-amber/30',
    yellow: 'bg-pastel-yellow/30',
    mint: 'bg-pastel-mint/30',
    teal: 'bg-pastel-teal/30',
    sky: 'bg-pastel-sky/30',
    lavender: 'bg-pastel-lavender/30',
    rose: 'bg-pastel-rose/30',
    gray: 'bg-pastel-gray/30',
  };
  return colorMap[color] || 'bg-card border border-border';
};

interface NotesViewProps {
  onEditingChange?: (isEditing: boolean) => void;
  isCreatingNew?: boolean;
  onCloseEditor?: () => void;
}

export function NotesView({ onEditingChange, isCreatingNew, onCloseEditor }: NotesViewProps) {
  const { notes, folders, addFolder, searchQuery } = useAppStore();
  const [viewTab, setViewTab] = useState<ViewTab>('all');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState<PastelColor>('sky');

  // Filter notes based on search, folder, and hideFromAllNotes
  const filteredNotes = notes
    .filter(note => {
      // When in "All Notes" (no selected folder), hide notes marked as hidden
      // BUT still show if there's a search query (still searchable)
      if (!selectedFolder && note.hideFromAllNotes && !searchQuery) {
        return false;
      }
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return note.title.toLowerCase().includes(query) || 
               note.content.toLowerCase().includes(query);
      }
      return true;
    })
    .filter(note => !selectedFolder || note.folder === selectedFolder)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const otherNotes = filteredNotes.filter(n => !n.isPinned);

  const getPreview = (content: string) => {
    return content
      .replace(/#{1,6}\s/g, '')
      .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
      .replace(/==/g, '')
      .slice(0, 100) + (content.length > 100 ? '...' : '');
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      addFolder({ name: newFolderName.trim(), color: newFolderColor });
      setNewFolderName('');
      setShowFolderModal(false);
    }
  };

  const handleOpenNote = (note: Note) => {
    setSelectedNote(note);
    onEditingChange?.(true);
  };

  const handleCloseEditor = () => {
    setSelectedNote(null);
    onEditingChange?.(false);
    onCloseEditor?.();
  };

  // Post-it style note card
  const NoteCard = ({ note, isGrid }: { note: Note; isGrid: boolean }) => {
    const folderData = folders.find(f => f.name === note.folder);
    
    return (
      <button
        onClick={() => handleOpenNote(note)}
        className={cn(
          'text-left group transition-all duration-200 w-full rounded-2xl p-4',
          getPostItBgClass(note.color),
          isGrid && 'min-h-[140px]',
          'shadow-soft hover:shadow-card'
        )}
      >
        <div className={cn('flex', isGrid ? 'flex-col h-full' : 'items-start justify-between')}>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {note.title || 'Untitled'}
              </h4>
              {note.isPinned && (
                <Star className="w-4 h-4 text-pastel-amber flex-shrink-0" fill="currentColor" />
              )}
            </div>
            <p className={cn(
              'text-sm text-muted-foreground mt-1',
              isGrid ? 'line-clamp-4' : 'line-clamp-2'
            )}>
              {getPreview(note.content)}
            </p>
          </div>
          
          <div className={cn(
            'flex items-center gap-2 flex-wrap',
            isGrid ? 'mt-auto pt-3' : 'mt-2'
          )}>
            {note.folder && (
              <span className={cn('flow-badge', folderData ? `flow-badge-${folderData.color}` : 'flow-badge-gray')}>
                {note.folder}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {format(new Date(note.updatedAt), 'MMM d')}
            </span>
          </div>
          
          {!isGrid && (
            <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
          )}
        </div>
      </button>
    );
  };

  // Show Note Editor (fullscreen) when editing or creating
  if (selectedNote || isCreatingNew) {
    return (
      <NoteEditor 
        note={selectedNote || undefined} 
        onClose={handleCloseEditor}
      />
    );
  }

  // Folders view
  if (viewTab === 'folders' && !selectedFolder) {
    return (
      <div className="min-h-screen pb-24">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flow-segment">
              <button
                onClick={() => setViewTab('all')}
                className="flow-segment-item"
              >
                All Notes
              </button>
              <button
                onClick={() => setViewTab('folders')}
                className="flow-segment-item flow-segment-item-active"
              >
                Folders
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex bg-secondary rounded-xl p-1">
                <button
                  onClick={() => setLayoutMode('list')}
                  className={cn('p-2 rounded-lg transition-colors', layoutMode === 'list' && 'bg-card shadow-soft')}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLayoutMode('grid')}
                  className={cn('p-2 rounded-lg transition-colors', layoutMode === 'grid' && 'bg-card shadow-soft')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowFolderModal(true)}
            className="w-full flow-card-flat flex items-center gap-3 mb-4"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FolderPlus className="w-5 h-5 text-primary" />
            </div>
            <span className="font-medium text-foreground">Create Folder</span>
          </button>

          <div className={cn(layoutMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3')}>
            {folders.map((folder) => {
              const folderNotes = notes.filter(n => n.folder === folder.name);
              return (
                <button
                  key={folder.id}
                  onClick={() => { setSelectedFolder(folder.name); setViewTab('all'); }}
                  className="flow-card text-left group w-full"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', `bg-pastel-${folder.color}/20`)}>
                      <Folder className={cn('w-6 h-6', `text-pastel-${folder.color}`)} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{folder.name}</h4>
                      <p className="text-sm text-muted-foreground">{folderNotes.length} notes</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Create Folder Modal */}
        {showFolderModal && (
          <>
            <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40" onClick={() => setShowFolderModal(false)} />
            <div className="fixed inset-x-4 bottom-0 z-50 flow-bottom-sheet animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">New Folder</h3>
                <button onClick={() => setShowFolderModal(false)} className="p-2 rounded-full bg-secondary">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="flow-input mb-4"
              />
              <div className="flex flex-wrap gap-2 mb-4">
                {pastelColors.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setNewFolderColor(c.value)}
                    className={cn(
                      'w-8 h-8 rounded-full transition-all',
                      c.class,
                      newFolderColor === c.value && 'ring-2 ring-offset-2 ring-primary'
                    )}
                  />
                ))}
              </div>
              <button onClick={handleCreateFolder} className="w-full flow-button-primary">
                Create Folder
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // All Notes / Folder view
  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flow-segment">
            <button
              onClick={() => { setViewTab('all'); setSelectedFolder(null); }}
              className={cn('flow-segment-item', viewTab === 'all' && 'flow-segment-item-active')}
            >
              All Notes
            </button>
            <button
              onClick={() => setViewTab('folders')}
              className={cn('flow-segment-item', viewTab === 'folders' && 'flow-segment-item-active')}
            >
              Folders
            </button>
          </div>
          
          <div className="flex bg-secondary rounded-xl p-1">
            <button
              onClick={() => setLayoutMode('list')}
              className={cn('p-2 rounded-lg transition-colors', layoutMode === 'list' && 'bg-card shadow-soft')}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayoutMode('grid')}
              className={cn('p-2 rounded-lg transition-colors', layoutMode === 'grid' && 'bg-card shadow-soft')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {selectedFolder && (
          <button
            onClick={() => setSelectedFolder(null)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground mb-4"
          >
            <Folder className="w-4 h-4" />
            <span className="text-sm font-medium">{selectedFolder}</span>
            <X className="w-4 h-4" />
          </button>
        )}

        {pinnedNotes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Pin className="w-4 h-4" /> Pinned
            </h3>
            <div className={cn(layoutMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3')}>
              {pinnedNotes.map(note => (
                <NoteCard key={note.id} note={note} isGrid={layoutMode === 'grid'} />
              ))}
            </div>
          </div>
        )}

        {otherNotes.length > 0 && (
          <div>
            {pinnedNotes.length > 0 && (
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Notes</h3>
            )}
            <div className={cn(layoutMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3')}>
              {otherNotes.map(note => (
                <NoteCard key={note.id} note={note} isGrid={layoutMode === 'grid'} />
              ))}
            </div>
          </div>
        )}

        {filteredNotes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No notes yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
