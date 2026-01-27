import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Eye, EyeOff, Settings, Trash2, ChevronDown, ChevronUp, Bold, Italic, List, ListOrdered, CheckSquare, Highlighter, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon, Mic, Plus, Undo2, Redo2 } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { DraggableImage } from './DraggableImage';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { NotebookPage, NoteType, PastelColor, Notebook } from '@/types';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { pastelColors } from '@/lib/colors';
import { compressImage } from '@/lib/mediaUtils';
import { VoiceRecordingModal } from './VoiceRecordingModal';
import { VoiceNoteExtension, insertVoiceNote } from './VoiceNoteExtension';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NotebookPageEditorProps {
  notebook: Notebook;
  page?: NotebookPage;
  onClose: () => void;
}

export function NotebookPageEditor({ notebook, page, onClose }: NotebookPageEditorProps) {
  const { addNotebookPage, updateNotebookPage, deleteNotebookPage, notebookPages } = useAppStore();
  
  const [title, setTitle] = useState(page?.title || '');
  const [showInCalendar, setShowInCalendar] = useState(page?.showInCalendar || false);
  const [hideDate, setHideDate] = useState(page?.hideDate || false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedColor, setSelectedColor] = useState<PastelColor | undefined>(page?.color);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      DraggableImage,
      VoiceNoteExtension,
    ],
    content: page?.content || '',
    editorProps: {
      attributes: {
        class: 'tiptap-editor outline-none min-h-[300px] leading-snug',
      },
    },
  });

  // Save on close
  const handleSave = () => {
    const content = editor?.getHTML() || '';
    const pagesInNotebook = notebookPages.filter(p => p.notebookId === notebook.id);
    
    if (page) {
      updateNotebookPage(page.id, {
        title: title || 'Untitled',
        content,
        showInCalendar,
        hideDate,
        color: selectedColor,
      });
    } else {
      addNotebookPage({
        notebookId: notebook.id,
        title: title || 'Untitled',
        content,
        type: 'note' as NoteType,
        order: pagesInNotebook.length,
        showInCalendar,
        hideDate,
        color: selectedColor,
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (page) {
      deleteNotebookPage(page.id);
    }
    onClose();
  };

  const cycleAlignment = () => {
    if (!editor) return;
    const current = editor.getAttributes('paragraph').textAlign || 'left';
    const next = current === 'left' ? 'center' : current === 'center' ? 'right' : 'left';
    editor.chain().focus().setTextAlign(next).run();
  };

  const getCurrentAlignment = () => {
    if (!editor) return 'left';
    return editor.getAttributes('paragraph').textAlign || 'left';
  };

  const getAlignIcon = () => {
    const align = getCurrentAlignment();
    if (align === 'center') return AlignCenter;
    if (align === 'right') return AlignRight;
    return AlignLeft;
  };

  const AlignIcon = getAlignIcon();

  // Handle image upload with size warning
  const handleAddImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const compressedBase64 = await compressImage(file);
          
          // Warn if image is large (> 500KB)
          const MAX_IMAGE_SIZE = 500 * 1024;
          if (compressedBase64.length > MAX_IMAGE_SIZE) {
            toast.warning('Image is large and may affect performance');
          }
          
          editor?.chain().focus().insertContent({
            type: 'image',
            attrs: { src: compressedBase64 },
          }).run();
        } catch (error) {
          console.error('Failed to process image:', error);
          toast.error('Could not add image');
        }
      }
    };
    
    input.click();
  };

  // Handle voice recording complete
  const handleVoiceRecordingComplete = (audioData: string, duration: number) => {
    if (editor) {
      insertVoiceNote(editor, audioData, duration);
    }
  };

  // Set CSS variable for note color
  useEffect(() => {
    if (selectedColor) {
      document.documentElement.style.setProperty('--note-color', `hsl(var(--pastel-${selectedColor}))`);
    } else {
      document.documentElement.style.removeProperty('--note-color');
    }
    return () => {
      document.documentElement.style.removeProperty('--note-color');
    };
  }, [selectedColor]);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Collapsible Toolbar */}
      <div className="sticky top-0 z-10">
        {showToolbar && (
          <div className="bg-card/80 backdrop-blur-xl border-b border-border/30 px-4 py-2 animate-fade-in">
            <div className="flex items-center justify-between gap-2">
              {/* Left group: Undo/Redo */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => editor?.chain().focus().undo().run()}
                  disabled={!editor?.can().undo()}
                  className={cn(
                    'p-2 rounded-lg transition-all active:scale-90',
                    !editor?.can().undo() && 'opacity-30 cursor-not-allowed active:scale-100',
                    'hover:bg-secondary/50'
                  )}
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor?.chain().focus().redo().run()}
                  disabled={!editor?.can().redo()}
                  className={cn(
                    'p-2 rounded-lg transition-all active:scale-90',
                    !editor?.can().redo() && 'opacity-30 cursor-not-allowed active:scale-100',
                    'hover:bg-secondary/50'
                  )}
                >
                  <Redo2 className="w-4 h-4" />
                </button>
                
                <div className="w-px h-4 bg-border mx-1" />
                
                {/* Format dropdown (Aa) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-0.5 px-2 py-1.5 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-all active:scale-95">
                      <span className="text-sm font-medium">Aa</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[140px]">
                    <DropdownMenuItem 
                      onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                      className={cn(editor?.isActive('heading', { level: 1 }) && 'bg-secondary')}
                    >
                      <span className="text-lg font-bold">Heading 1</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={cn(editor?.isActive('heading', { level: 2 }) && 'bg-secondary')}
                    >
                      <span className="text-base font-semibold">Heading 2</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => editor?.chain().focus().setParagraph().run()}
                      className={cn(editor?.isActive('paragraph') && !editor?.isActive('heading') && 'bg-secondary')}
                    >
                      <span className="text-sm">Body text</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={cycleAlignment}>
                      <AlignIcon className="w-4 h-4 mr-2" />
                      <span>Alignment</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <button
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={cn('p-2 rounded-lg transition-colors', editor?.isActive('bold') ? 'bg-secondary' : 'hover:bg-secondary/50')}
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={cn('p-2 rounded-lg transition-colors', editor?.isActive('italic') ? 'bg-secondary' : 'hover:bg-secondary/50')}
                >
                  <Italic className="w-4 h-4" />
                </button>
              </div>

              {/* Right group: Insert dropdown + Settings + Delete */}
              <div className="flex items-center gap-0.5">
                {/* Insert dropdown (+) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-0.5 px-2 py-1.5 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-all active:scale-95">
                      <Plus className="w-4 h-4" />
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[160px]">
                    <DropdownMenuItem 
                      onClick={() => editor?.chain().focus().toggleBulletList().run()}
                      className={cn(editor?.isActive('bulletList') && 'bg-secondary')}
                    >
                      <List className="w-4 h-4 mr-2" />
                      <span>Bullet list</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                      className={cn(editor?.isActive('orderedList') && 'bg-secondary')}
                    >
                      <ListOrdered className="w-4 h-4 mr-2" />
                      <span>Numbered list</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => editor?.chain().focus().toggleTaskList().run()}
                      className={cn(editor?.isActive('taskList') && 'bg-secondary')}
                    >
                      <CheckSquare className="w-4 h-4 mr-2" />
                      <span>Checklist</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleAddImage}>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      <span>Image</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowVoiceRecorder(true)}>
                      <Mic className="w-4 h-4 mr-2" />
                      <span>Voice note</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => editor?.chain().focus().toggleHighlight().run()}>
                      <Highlighter className="w-4 h-4 mr-2" />
                      <span>Highlight</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={cn('p-2 rounded-lg transition-colors', showSettings ? 'bg-secondary' : 'hover:bg-secondary/50')}
                >
                  <Settings className="w-4 h-4" />
                </button>
                {page && (
                  <button
                    onClick={handleDelete}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toolbar toggle tab */}
        <button
          onClick={() => setShowToolbar(!showToolbar)}
          className="absolute left-1/2 -translate-x-1/2 -bottom-5 bg-card/80 backdrop-blur-xl px-4 py-1 rounded-b-xl border border-t-0 border-border/30 z-20"
        >
          {showToolbar ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 pt-8">
        <button 
          onClick={handleSave}
          className="w-10 h-10 rounded-full bg-card shadow-md flex items-center justify-center active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex-1">
          {!hideDate && (
            <Popover>
              <PopoverTrigger asChild>
                <button className={cn(
                  'text-sm font-medium',
                  selectedColor ? `text-[hsl(var(--pastel-${selectedColor}))]` : 'text-muted-foreground'
                )}>
                  {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : format(new Date(), 'MMMM d, yyyy')}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Settings popup */}
      {showSettings && (
        <div 
          className="mx-4 mb-4 p-4 bg-card rounded-2xl border border-border animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-4">
            {/* Color picker */}
            <div>
              <label className="text-sm font-medium mb-2 block">Color</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedColor(undefined)}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-all',
                    !selectedColor ? 'border-foreground scale-110' : 'border-border'
                  )}
                  style={{ background: 'white' }}
                />
                {pastelColors.map(colorObj => (
                  <button
                    key={colorObj.value}
                    onClick={() => setSelectedColor(colorObj.value)}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-all',
                      selectedColor === colorObj.value ? 'border-foreground scale-110' : 'border-transparent'
                    )}
                    style={{ background: `hsl(var(--pastel-${colorObj.value}))` }}
                  />
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Show in Calendar</span>
              </div>
              <button
                onClick={() => setShowInCalendar(!showInCalendar)}
                className={cn(
                  'w-11 h-6 rounded-full transition-all duration-200 flex items-center px-0.5',
                  showInCalendar ? 'bg-primary/20 border border-primary/40 justify-end' : 'bg-secondary/50 border border-border justify-start'
                )}
              >
                <span 
                  className={cn(
                    'w-5 h-5 rounded-full transition-all duration-200 shadow-sm',
                    showInCalendar ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hideDate ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                <span className="text-sm">Hide Date</span>
              </div>
              <button
                onClick={() => setHideDate(!hideDate)}
                className={cn(
                  'w-11 h-6 rounded-full transition-all duration-200 flex items-center px-0.5',
                  hideDate ? 'bg-primary/20 border border-primary/40 justify-end' : 'bg-secondary/50 border border-border justify-start'
                )}
              >
                <span 
                  className={cn(
                    'w-5 h-5 rounded-full transition-all duration-200 shadow-sm',
                    hideDate ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-auto px-4" onClick={() => showSettings && setShowSettings(false)}>
        <div className="bg-secondary/20 rounded-2xl p-4 min-h-full">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full text-2xl font-bold bg-transparent border-0 outline-none mb-4 placeholder:text-muted-foreground/50"
          />
          <div className="tiptap-content">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* Voice Recording Modal */}
      <VoiceRecordingModal
        isOpen={showVoiceRecorder}
        onClose={() => setShowVoiceRecorder(false)}
        onRecordingComplete={handleVoiceRecordingComplete}
      />
    </div>
  );
}
