import { useState, useRef } from 'react';
import { ArrowLeft, Plus, BookOpen, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { Notebook, NotebookPage } from '@/types';
import { NotebookPageEditor } from './NotebookPageEditor';

interface NotebookViewProps {
  notebook: Notebook;
  onClose: () => void;
}

export function NotebookView({ notebook, onClose }: NotebookViewProps) {
  const { notebookPages, addNotebookPage, updateNotebookPage } = useAppStore();
  const [selectedPage, setSelectedPage] = useState<NotebookPage | null>(null);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const justFinishedEditingRef = useRef(false);

  const getDisplayName = (page: NotebookPage) => {
    if (page.title) return page.title;
    const plain = page.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return plain.slice(0, 60) || 'Untitled page';
  };

  const startEditing = (e: React.MouseEvent, page: NotebookPage) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingPageId(page.id);
    setEditingTitle(page.title || '');
  };

  const saveTitle = (page: NotebookPage) => {
    updateNotebookPage(page.id, { title: editingTitle.trim() });
    justFinishedEditingRef.current = true;
    setEditingPageId(null);
    setTimeout(() => { justFinishedEditingRef.current = false; }, 300);
  };

  const pages = notebookPages
    .filter(p => p.notebookId === notebook.id)
    .sort((a, b) => a.order - b.order);

  const handleAddPage = () => {
    setIsCreatingPage(true);
  };

  // Show page editor
  if (selectedPage || isCreatingPage) {
    return (
      <NotebookPageEditor
        notebook={notebook}
        page={selectedPage || undefined}
        onClose={() => {
          setSelectedPage(null);
          setIsCreatingPage(false);
        }}
      />
    );
  }

  const notebookColor = `hsl(var(--pastel-${notebook.color}-accent))`;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center active:scale-95 transition-all"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" style={{ color: notebookColor }} />
          <h1 className="flow-page-title">{notebook.name}</h1>
        </div>
      </div>

      {/* Pages list */}
      <div className="px-4 py-4" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {pages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No pages yet</p>
            <p className="text-sm">Add your first page</p>
          </div>
        ) : (
          pages.map((page, index) => {
            const plainText = page.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
            const preview = page.title ? plainText.slice(0, 60) : '';
            const isEditing = editingPageId === page.id;
            return (
              <button
                key={page.id}
                onClick={() => {
                  if (editingPageId !== null || justFinishedEditingRef.current) return;
                  setSelectedPage(page);
                }}
                className="w-full text-left transition-all active:scale-[0.98] bg-white"
                style={{
                  borderRadius: 14,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                  height: 72,
                  padding: 16,
                }}
              >
                <div className="flex items-center gap-3 h-full">
                  <FileText className="w-5 h-5 shrink-0" style={{ color: '#C7C7CC' }} />
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => saveTitle(page)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); saveTitle(page); }
                          if (e.key === 'Escape') setEditingPageId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Custom name…"
                        className="w-full text-sm font-semibold bg-transparent border-b border-primary/50 outline-none text-foreground"
                      />
                    ) : (
                      <h4
                        className="flow-card-title truncate"
                        onClick={(e) => startEditing(e, page)}
                      >
                        {getDisplayName(page)}
                      </h4>
                    )}
                    {preview && (
                      <p className="flow-meta truncate">
                        {preview}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 flow-meta-sm">
                    Page {index + 1}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Add page FAB */}
      <div className="fixed bottom-[144px] right-4 z-[1100]">
        <button
          onClick={handleAddPage}
          className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95',
            `bg-[hsl(var(--pastel-${notebook.color}))]`
          )}
          style={{ boxShadow: '0 -2px 8px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.12)' }}
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
