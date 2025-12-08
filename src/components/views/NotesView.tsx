import { useState } from 'react';
import { format } from 'date-fns';
import { 
  Folder, 
  FileText, 
  Pin, 
  MoreHorizontal,
  ChevronRight,
  Star,
  Tag,
  LayoutGrid,
  LayoutList,
  Plus,
  X,
  Trash2,
  Edit3,
  Bold,
  Italic,
  List,
  CheckSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { Note, PastelColor } from '@/types';
import { pastelColors } from '@/lib/colors';

type ViewTab = 'all' | 'folders';
type LayoutMode = 'list' | 'grid';

export function NotesView() {
  const { notes, folders, togglePinNote, updateNote, deleteNote, searchQuery, addFolder } = useAppStore();
  const [viewTab, setViewTab] = useState<ViewTab>('all');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('list');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState<PastelColor>('sky');

  const filteredNotes = notes
    .filter(note => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return note.title.toLowerCase().includes(query) || 
               note.content.toLowerCase().includes(query) ||
               note.tags.some(t => t.toLowerCase().includes(query));
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
      .slice(0, 100) + (content.length > 100 ? '...' : '');
  };

  const handleSaveNote = () => {
    if (selectedNote) {
      updateNote(selectedNote.id, { title: editTitle, content: editContent });
      setSelectedNote({ ...selectedNote, title: editTitle, content: editContent });
    }
    setIsEditing(false);
  };

  const handleDeleteNote = () => {
    if (selectedNote) {
      deleteNote(selectedNote.id);
      setSelectedNote(null);
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      addFolder({ name: newFolderName.trim(), color: newFolderColor });
      setNewFolderName('');
      setShowFolderModal(false);
    }
  };

  const NoteCard = ({ note, isGrid }: { note: Note; isGrid: boolean }) => (
    <button
      onClick={() => {
        setSelectedNote(note);
        setEditTitle(note.title);
        setEditContent(note.content);
      }}
      className={cn(
        'text-left group transition-all duration-200 w-full',
        isGrid ? 'flow-note-card' : 'flow-card-flat'
      )}
    >
      <div className={cn('flex', isGrid ? 'flex-col' : 'items-start justify-between')}>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {note.title}
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
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={cn('flow-badge', `flow-badge-${note.color}`)}>{note.folder}</span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(note.updatedAt), 'MMM d')}
            </span>
          </div>
        </div>
        {!isGrid && (
          <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        )}
      </div>
    </button>
  );

  // Note Editor View
  if (selectedNote) {
    return (
      <div className="min-h-screen pb-24 animate-fade-in">
        <div className="sticky top-14 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="px-4 py-3 flex items-center justify-between">
            <button 
              onClick={() => {
                if (isEditing) handleSaveNote();
                setSelectedNote(null);
                setIsEditing(false);
              }}
              className="text-primary font-medium text-sm"
            >
              ← Back
            </button>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => togglePinNote(selectedNote.id)}
                className={cn(
                  'p-2 rounded-xl transition-colors',
                  selectedNote.isPinned ? 'bg-pastel-amber/20 text-pastel-amber' : 'bg-secondary text-muted-foreground'
                )}
              >
                <Pin className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={cn(
                  'p-2 rounded-xl transition-colors',
                  isEditing ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                )}
              >
                <Edit3 className="w-5 h-5" />
              </button>
              <button 
                onClick={handleDeleteNote}
                className="p-2 rounded-xl bg-destructive/10 text-destructive"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-4">
          {isEditing ? (
            <div className="space-y-4">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-2xl font-bold bg-transparent border-0 outline-none text-foreground"
                placeholder="Note title"
              />
              
              {/* Formatting toolbar */}
              <div className="flex items-center gap-2 py-2 border-b border-border">
                <button className="p-2 rounded-lg hover:bg-secondary">
                  <Bold className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="p-2 rounded-lg hover:bg-secondary">
                  <Italic className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="p-2 rounded-lg hover:bg-secondary">
                  <List className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="p-2 rounded-lg hover:bg-secondary">
                  <CheckSquare className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[400px] bg-transparent border-0 outline-none text-foreground resize-none leading-relaxed"
                placeholder="Start writing..."
              />
              
              <button
                onClick={handleSaveNote}
                className="w-full flow-button-primary"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-2">{selectedNote.title}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                <span className={cn('flow-badge', `flow-badge-${selectedNote.color}`)}>{selectedNote.folder}</span>
                <span>{format(new Date(selectedNote.updatedAt), 'MMM d, yyyy')}</span>
              </div>
              
              {selectedNote.tags.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  {selectedNote.tags.map((tag) => (
                    <span key={tag} className="flow-badge flow-badge-gray">#{tag}</span>
                  ))}
                </div>
              )}
              
              <div className="flow-card-flat">
                <div className="prose prose-sm max-w-none">
                  {selectedNote.content.split('\n').map((line, i) => {
                    if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold mt-4 mb-2 text-foreground">{line.slice(3)}</h2>;
                    if (line.startsWith('### ')) return <h3 key={i} className="text-base font-semibold mt-3 mb-1 text-foreground">{line.slice(4)}</h3>;
                    if (line.startsWith('- [ ] ')) return (
                      <div key={i} className="flex items-center gap-2 my-1">
                        <div className="w-4 h-4 rounded border-2 border-muted-foreground" />
                        <span className="text-foreground">{line.slice(6)}</span>
                      </div>
                    );
                    if (line.startsWith('- [x] ')) return (
                      <div key={i} className="flex items-center gap-2 my-1 text-muted-foreground">
                        <div className="w-4 h-4 rounded border-2 border-primary bg-primary flex items-center justify-center">
                          <span className="text-primary-foreground text-xs">✓</span>
                        </div>
                        <span className="line-through">{line.slice(6)}</span>
                      </div>
                    );
                    if (line.startsWith('- ')) return (
                      <div key={i} className="flex items-start gap-2 my-1">
                        <span className="text-muted-foreground">•</span>
                        <span className="text-foreground">{line.slice(2)}</span>
                      </div>
                    );
                    if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold my-1 text-foreground">{line.slice(2, -2)}</p>;
                    if (line.trim() === '') return <div key={i} className="h-2" />;
                    return <p key={i} className="my-1 text-foreground">{line}</p>;
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
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
              <Plus className="w-5 h-5 text-primary" />
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
            <div className={cn(layoutMode === 'grid' ? 'flow-note-grid' : 'space-y-3')}>
              {pinnedNotes.map((note) => (
                <NoteCard key={note.id} note={note} isGrid={layoutMode === 'grid'} />
              ))}
            </div>
          </div>
        )}

        {otherNotes.length > 0 && (
          <div>
            {pinnedNotes.length > 0 && (
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">All Notes</h3>
            )}
            <div className={cn(layoutMode === 'grid' ? 'flow-note-grid' : 'space-y-3')}>
              {otherNotes.map((note) => (
                <NoteCard key={note.id} note={note} isGrid={layoutMode === 'grid'} />
              ))}
            </div>
          </div>
        )}

        {filteredNotes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No notes yet</h3>
            <p className="text-sm text-muted-foreground">Create your first note</p>
          </div>
        )}
      </div>
    </div>
  );
}