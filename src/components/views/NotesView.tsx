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
  Mic,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { Note } from '@/types';
import { Header } from '@/components/navigation/Header';

type ViewTab = 'all' | 'folders';
type LayoutMode = 'list' | 'grid';

export function NotesView() {
  const { notes, folders, togglePinNote, searchQuery } = useAppStore();
  const [viewTab, setViewTab] = useState<ViewTab>('all');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('list');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

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
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const otherNotes = filteredNotes.filter(n => !n.isPinned);

  const getPreview = (content: string) => {
    return content
      .replace(/#{1,6}\s/g, '')
      .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/- \[[ x]\]/g, '')
      .slice(0, 80) + (content.length > 80 ? '...' : '');
  };

  const NoteCard = ({ note, isGrid }: { note: Note; isGrid: boolean }) => (
    <button
      onClick={() => setSelectedNote(note)}
      className={cn(
        'text-left group transition-all duration-200',
        isGrid ? 'flow-note-card' : 'flow-card-flat'
      )}
    >
      <div className={cn(
        'flex',
        isGrid ? 'flex-col' : 'items-start justify-between'
      )}>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {note.title}
            </h4>
            {note.isPinned && (
              <Star className="w-4 h-4 text-flow-amber flex-shrink-0" fill="currentColor" />
            )}
          </div>
          <p className={cn(
            'text-sm text-muted-foreground mt-1',
            isGrid ? 'line-clamp-4' : 'line-clamp-2'
          )}>
            {getPreview(note.content)}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs text-muted-foreground">{note.folder}</span>
            {(note as any).date && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-primary flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format((note as any).date, 'MMM d')}
                </span>
              </>
            )}
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {format(note.updatedAt, 'MMM d')}
            </span>
            {note.tags.length > 0 && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="flex items-center gap-1 text-xs text-primary">
                  <Tag className="w-3 h-3" />
                  {note.tags.length}
                </span>
              </>
            )}
          </div>
        </div>
        {!isGrid && (
          <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        )}
      </div>
    </button>
  );

  // Note detail view
  if (selectedNote) {
    return (
      <div className="min-h-screen pb-32 animate-fade-in">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="px-6 py-4 flex items-center justify-between">
            <button 
              onClick={() => setSelectedNote(null)}
              className="text-primary font-medium"
            >
              ← Back
            </button>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => togglePinNote(selectedNote.id)}
                className={cn(
                  'p-2 rounded-xl transition-colors',
                  selectedNote.isPinned ? 'bg-flow-amber/20 text-flow-amber' : 'bg-secondary text-muted-foreground'
                )}
              >
                <Pin className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-xl bg-secondary text-muted-foreground">
                <Mic className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-xl bg-secondary text-muted-foreground">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="px-6 py-4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground mb-2">{selectedNote.title}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{selectedNote.folder}</span>
              <span>•</span>
              <span>{format(selectedNote.updatedAt, 'MMM d, yyyy')}</span>
            </div>
            {selectedNote.tags.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                {selectedNote.tags.map((tag) => (
                  <span key={tag} className="flow-badge flow-badge-primary">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flow-card-flat">
            <div className="prose prose-sm max-w-none">
              {selectedNote.content.split('\n').map((line, i) => {
                if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-lg font-semibold mt-4 mb-2">{line.slice(3)}</h2>;
                }
                if (line.startsWith('### ')) {
                  return <h3 key={i} className="text-base font-semibold mt-3 mb-1">{line.slice(4)}</h3>;
                }
                if (line.startsWith('- [ ] ')) {
                  return (
                    <div key={i} className="flex items-center gap-2 my-1">
                      <div className="w-4 h-4 rounded border-2 border-muted-foreground" />
                      <span>{line.slice(6)}</span>
                    </div>
                  );
                }
                if (line.startsWith('- [x] ')) {
                  return (
                    <div key={i} className="flex items-center gap-2 my-1 text-muted-foreground">
                      <div className="w-4 h-4 rounded border-2 border-primary bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground text-xs">✓</span>
                      </div>
                      <span className="line-through">{line.slice(6)}</span>
                    </div>
                  );
                }
                if (line.startsWith('- ')) {
                  return (
                    <div key={i} className="flex items-start gap-2 my-1">
                      <span className="text-muted-foreground">•</span>
                      <span>{line.slice(2)}</span>
                    </div>
                  );
                }
                if (line.match(/^\d+\. /)) {
                  const num = line.match(/^(\d+)\. /)?.[1];
                  return (
                    <div key={i} className="flex items-start gap-2 my-1">
                      <span className="text-primary font-medium">{num}.</span>
                      <span>{line.replace(/^\d+\. /, '')}</span>
                    </div>
                  );
                }
                if (line.startsWith('**') && line.endsWith('**')) {
                  return <p key={i} className="font-semibold my-1">{line.slice(2, -2)}</p>;
                }
                if (line.trim() === '') {
                  return <div key={i} className="h-2" />;
                }
                return <p key={i} className="my-1 text-foreground">{line}</p>;
              })}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Folders view
  if (viewTab === 'folders' && !selectedFolder) {
    return (
      <div className="min-h-screen pb-32">
        <Header 
          title="Notes" 
          subtitle={`${notes.length} notes`} 
        />

        <main className="px-6 py-4">
          {/* Sub-tabs */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex bg-secondary rounded-2xl p-1">
              <button
                onClick={() => setViewTab('all')}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  viewTab === 'all' ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground'
                )}
              >
                All Notes
              </button>
              <button
                onClick={() => setViewTab('folders')}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  viewTab === 'folders' ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground'
                )}
              >
                Folders
              </button>
            </div>

            {/* Layout Toggle */}
            <div className="flex bg-secondary rounded-xl p-1">
              <button
                onClick={() => setLayoutMode('list')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  layoutMode === 'list' ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground'
                )}
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayoutMode('grid')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  layoutMode === 'grid' ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground'
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Folders Grid/List */}
          <div className={cn(
            layoutMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'
          )}>
            {folders.map((folder) => {
              const folderNotes = notes.filter(n => n.folder === folder.name);
              return (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.name)}
                  className={cn(
                    'flow-card text-left group',
                    layoutMode === 'grid' ? 'p-4' : ''
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-12 h-12 rounded-2xl flex items-center justify-center',
                      `bg-flow-${folder.color}/20`
                    )}>
                      <Folder className={cn('w-6 h-6', `text-flow-${folder.color}`)} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {folder.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {folderNotes.length} notes
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </button>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <Header 
        title="Notes" 
        subtitle={`${notes.length} notes`} 
      />

      <main className="px-6 py-4">
        {/* Sub-tabs & Layout Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex bg-secondary rounded-2xl p-1">
            <button
              onClick={() => { setViewTab('all'); setSelectedFolder(null); }}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                viewTab === 'all' ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground'
              )}
            >
              All Notes
            </button>
            <button
              onClick={() => setViewTab('folders')}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                viewTab === 'folders' ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground'
              )}
            >
              Folders
            </button>
          </div>

          {/* Layout Toggle */}
          <div className="flex bg-secondary rounded-xl p-1">
            <button
              onClick={() => setLayoutMode('list')}
              className={cn(
                'p-2 rounded-lg transition-colors',
                layoutMode === 'list' ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground'
              )}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayoutMode('grid')}
              className={cn(
                'p-2 rounded-lg transition-colors',
                layoutMode === 'grid' ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Folder filter (when in All Notes but folder selected) */}
        {selectedFolder && (
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setSelectedFolder(null)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground"
            >
              <Folder className="w-4 h-4" />
              <span className="text-sm font-medium">{selectedFolder}</span>
              <span className="text-xs opacity-70">×</span>
            </button>
          </div>
        )}

        {/* Quick folder filter pills */}
        {!selectedFolder && (
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 -mx-6 px-6">
            <button
              onClick={() => setSelectedFolder(null)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground whitespace-nowrap"
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">All</span>
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.name)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-muted-foreground whitespace-nowrap hover:bg-muted transition-colors"
              >
                <Folder className="w-4 h-4" />
                <span className="text-sm font-medium">{folder.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Pinned Notes */}
        {pinnedNotes.length > 0 && (
          <div className="mb-6 animate-fade-up">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Pin className="w-4 h-4" />
              Pinned
            </h3>
            <div className={cn(
              layoutMode === 'grid' ? 'flow-note-grid' : 'space-y-3'
            )}>
              {pinnedNotes.map((note) => (
                <NoteCard key={note.id} note={note} isGrid={layoutMode === 'grid'} />
              ))}
            </div>
          </div>
        )}

        {/* Other Notes */}
        {otherNotes.length > 0 && (
          <div className="animate-fade-up stagger-1">
            {pinnedNotes.length > 0 && (
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">All Notes</h3>
            )}
            <div className={cn(
              layoutMode === 'grid' ? 'flow-note-grid' : 'space-y-3'
            )}>
              {otherNotes.map((note, i) => (
                <div key={note.id} style={{ animationDelay: `${i * 0.05}s` }}>
                  <NoteCard note={note} isGrid={layoutMode === 'grid'} />
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredNotes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-up">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No notes yet</h3>
            <p className="text-sm text-muted-foreground">Create your first note</p>
          </div>
        )}
      </main>
    </div>
  );
}
