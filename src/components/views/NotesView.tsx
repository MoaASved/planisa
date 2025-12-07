import { useState } from 'react';
import { format } from 'date-fns';
import { 
  Plus, 
  Search, 
  Folder, 
  FileText, 
  Pin, 
  MoreHorizontal,
  ChevronRight,
  Star,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { Note } from '@/types';
import { Header } from '@/components/navigation/Header';

export function NotesView() {
  const { notes, folders, togglePinNote, searchQuery } = useAppStore();
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
      .slice(0, 100) + (content.length > 100 ? '...' : '');
  };

  if (selectedNote) {
    return (
      <div className="min-h-screen pb-24 animate-fade-in">
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

  return (
    <div className="min-h-screen pb-24">
      <Header 
        title="Notes" 
        subtitle={`${notes.length} notes`} 
      />

      <main className="px-6 py-4">
        {/* Folders */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 -mx-6 px-6">
          <button
            onClick={() => setSelectedFolder(null)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200',
              !selectedFolder 
                ? 'bg-primary text-primary-foreground shadow-card' 
                : 'bg-secondary text-muted-foreground hover:bg-muted'
            )}
          >
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">All Notes</span>
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolder(folder.name)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200',
                selectedFolder === folder.name 
                  ? 'bg-primary text-primary-foreground shadow-card' 
                  : 'bg-secondary text-muted-foreground hover:bg-muted'
              )}
            >
              <Folder className="w-4 h-4" />
              <span className="text-sm font-medium">{folder.name}</span>
            </button>
          ))}
        </div>

        {/* Pinned Notes */}
        {pinnedNotes.length > 0 && (
          <div className="mb-6 animate-fade-up">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Pin className="w-4 h-4" />
              Pinned
            </h3>
            <div className="grid gap-3">
              {pinnedNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className="flow-card text-left group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {note.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {getPreview(note.content)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">{note.folder}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {format(note.updatedAt, 'MMM d')}
                        </span>
                      </div>
                    </div>
                    <Star className="w-4 h-4 text-flow-amber flex-shrink-0" fill="currentColor" />
                  </div>
                </button>
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
            <div className="grid gap-3">
              {otherNotes.map((note, i) => (
                <button
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className="flow-card-flat text-left group"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {note.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {getPreview(note.content)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">{note.folder}</span>
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
                    <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                </button>
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

      {/* FAB */}
      <button className="fixed right-6 bottom-24 w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-elevated flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
