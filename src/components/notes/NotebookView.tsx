import { useState } from 'react';
import { ArrowLeft, Plus, BookOpen, FileText, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { Notebook, NotebookPage } from '@/types';
import { NoteEditor } from './NoteEditor';
import { StickyNoteEditor } from './StickyNoteEditor';

interface NotebookViewProps {
  notebook: Notebook;
  onClose: () => void;
}

export function NotebookView({ notebook, onClose }: NotebookViewProps) {
  const { notebookPages, addNotebookPage } = useAppStore();
  const [selectedPage, setSelectedPage] = useState<NotebookPage | null>(null);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const pages = notebookPages
    .filter(p => p.notebookId === notebook.id)
    .sort((a, b) => a.order - b.order);

  const handleAddPage = (type: 'note' | 'sticky') => {
    addNotebookPage({
      notebookId: notebook.id,
      title: type === 'note' ? 'Untitled Page' : 'Quick Note',
      content: '',
      type,
      order: pages.length,
    });
    setShowAddMenu(false);
  };

  // Show page editor
  if (selectedPage || isCreatingPage) {
    // For now, we'll use a simplified editor approach
    // In a full implementation, you'd adapt NoteEditor for notebook pages
    return (
      <div className="fixed inset-0 bg-background z-50">
        <div className="flex items-center px-4 py-3">
          <button 
            onClick={() => { setSelectedPage(null); setIsCreatingPage(false); }}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="px-4 py-8 text-center text-muted-foreground">
          <p>Page editor coming soon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-8 h-10 rounded-lg flex items-center justify-center relative',
            `bg-pastel-${notebook.color}/30`
          )}>
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/10 rounded-l-lg" />
            <BookOpen className={cn('w-4 h-4', `text-pastel-${notebook.color}`)} />
          </div>
          <h1 className="font-semibold text-lg">{notebook.name}</h1>
        </div>
      </div>

      {/* Pages list */}
      <div className="px-4 py-4 space-y-2">
        {pages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No pages yet</p>
            <p className="text-sm">Add your first page</p>
          </div>
        ) : (
          pages.map((page, index) => (
            <button
              key={page.id}
              onClick={() => setSelectedPage(page)}
              className={cn(
                'w-full text-left p-4 rounded-xl transition-all active:scale-[0.98]',
                page.type === 'sticky' 
                  ? `bg-pastel-${page.color || 'yellow'}/40` 
                  : 'bg-card border border-border'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center">
                  {page.type === 'sticky' ? (
                    <StickyNote className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{page.title}</h4>
                  <p className="text-sm text-muted-foreground truncate">
                    {page.content.replace(/<[^>]*>/g, '').slice(0, 50) || 'Empty page'}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">Page {index + 1}</span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Add page FAB */}
      <div className="fixed bottom-24 right-4 z-30">
        {showAddMenu && (
          <>
            <div 
              className="fixed inset-0" 
              onClick={() => setShowAddMenu(false)} 
            />
            <div className="absolute bottom-16 right-0 bg-card rounded-2xl shadow-lg border border-border p-2 min-w-[160px] animate-in fade-in-0 slide-in-from-bottom-2">
              <button
                onClick={() => handleAddPage('note')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors"
              >
                <FileText className="w-5 h-5 text-primary" />
                <span className="font-medium">Add Page</span>
              </button>
              <button
                onClick={() => handleAddPage('sticky')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors"
              >
                <StickyNote className="w-5 h-5 text-pastel-yellow" />
                <span className="font-medium">Add Sticky</span>
              </button>
            </div>
          </>
        )}
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className={cn(
            'w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95',
            `bg-pastel-${notebook.color}`
          )}
        >
          <Plus className={cn('w-6 h-6 transition-transform', showAddMenu && 'rotate-45')} />
        </button>
      </div>
    </div>
  );
}