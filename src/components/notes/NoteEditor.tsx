import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';
import { 
  ArrowLeft, 
  Folder, 
  Palette, 
  Pin, 
  Trash2,
  Bold,
  Italic,
  List,
  ListOrdered,
  CheckSquare,
  Highlighter,
  Calendar,
  EyeOff,
  Settings,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { Note, PastelColor } from '@/types';
import { FolderPickerSheet } from './FolderPickerSheet';
import { ColorPickerSheet } from './ColorPickerSheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { pastelColors } from '@/lib/colors';

interface NoteEditorProps {
  note?: Note;
  onClose: () => void;
}

// Color map for dynamic styling
const colorHslMap: Record<PastelColor, string> = {
  coral: 'hsl(12, 76%, 70%)',
  peach: 'hsl(25, 70%, 75%)',
  amber: 'hsl(38, 80%, 70%)',
  yellow: 'hsl(48, 85%, 75%)',
  mint: 'hsl(158, 50%, 65%)',
  teal: 'hsl(175, 50%, 60%)',
  sky: 'hsl(200, 70%, 70%)',
  lavender: 'hsl(262, 60%, 75%)',
  rose: 'hsl(340, 60%, 75%)',
  gray: 'hsl(220, 10%, 70%)',
};

export function NoteEditor({ note, onClose }: NoteEditorProps) {
  const { addNote, updateNote, deleteNote, togglePinNote, folders } = useAppStore();
  
  const [title, setTitle] = useState(note?.title || '');
  const [folder, setFolder] = useState<string | undefined>(note?.folder);
  const [color, setColor] = useState<PastelColor | undefined>(note?.color);
  const [date, setDate] = useState<Date>(note?.date ? new Date(note.date) : new Date());
  const [isPinned, setIsPinned] = useState(note?.isPinned || false);
  const [showInCalendar, setShowInCalendar] = useState(note?.showInCalendar || false);
  const [hideFromAllNotes, setHideFromAllNotes] = useState(note?.hideFromAllNotes || false);
  
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'highlight',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: note?.content || '',
    editorProps: {
      attributes: {
        class: 'tiptap-editor prose prose-sm min-h-[300px] outline-none max-w-none',
      },
    },
  });

  // Keyboard-aware toolbar
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      const heightDiff = window.innerHeight - viewport.height;
      setKeyboardHeight(heightDiff > 100 ? heightDiff : 0);
    };

    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', handleResize);
    
    return () => {
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', handleResize);
    };
  }, []);

  const handleSave = () => {
    const noteData = {
      title: title.trim() || 'Untitled',
      content: editor?.getHTML() || '',
      folder,
      color,
      date,
      tags: [],
      isPinned,
      showInCalendar,
      hideFromAllNotes,
    };

    if (note) {
      updateNote(note.id, noteData);
    } else {
      addNote(noteData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (note) {
      deleteNote(note.id);
    }
    onClose();
  };

  const handleTogglePin = () => {
    if (note) {
      togglePinNote(note.id);
      setIsPinned(!isPinned);
    } else {
      setIsPinned(!isPinned);
    }
  };

  const handleHighlight = (highlightColor: PastelColor) => {
    editor?.chain().focus().toggleHighlight({ color: colorHslMap[highlightColor] }).run();
    setShowHighlightPicker(false);
  };

  const cycleAlignment = () => {
    const next = textAlign === 'left' ? 'center' : textAlign === 'center' ? 'right' : 'left';
    setTextAlign(next);
    editor?.chain().focus().setTextAlign(next).run();
  };

  const getAlignmentIcon = () => {
    switch (textAlign) {
      case 'center': return AlignCenter;
      case 'right': return AlignRight;
      default: return AlignLeft;
    }
  };

  const AlignIcon = getAlignmentIcon();
  const selectedFolder = folders.find(f => f.name === folder);
  const noteColorStyle = color ? colorHslMap[color] : undefined;

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#F8F7F4] dark:bg-background flex flex-col animate-fade-in"
      style={{ '--note-color': noteColorStyle } as React.CSSProperties}
    >
      {/* Header - Only back arrow */}
      <div className="flex items-center px-4 py-3">
        <button 
          onClick={handleSave}
          className="p-2 -ml-2 rounded-xl text-foreground hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Date and Folder centered */}
      <div className="flex flex-col items-center px-4 pb-4">
        <span 
          className="text-sm font-medium"
          style={{ color: noteColorStyle || 'hsl(var(--muted-foreground))' }}
        >
          {format(date, 'd MMMM yyyy', { locale: sv })}
        </span>
        {folder && (
          <span className={cn('flow-badge mt-1', selectedFolder ? `flow-badge-${selectedFolder.color}` : 'flow-badge-gray')}>
            {folder}
          </span>
        )}
      </div>

      {/* Content */}
      <div 
        className="flex-1 overflow-y-auto px-4"
        style={{ paddingBottom: keyboardHeight > 0 ? '60px' : '40px' }}
      >
        {/* Title input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-2xl font-bold bg-transparent border-0 outline-none text-foreground mb-4 text-center"
          placeholder="Note title"
        />
        
        {/* TipTap Editor */}
        <EditorContent editor={editor} className="tiptap-content" />
      </div>

      {/* Collapsible Vertical Toolbar */}
      <div 
        className={cn(
          "fixed right-3 flex flex-col items-center transition-all duration-300 z-50",
          toolbarCollapsed ? "translate-x-12" : "translate-x-0"
        )}
        style={{ 
          bottom: keyboardHeight + 80,
          maxHeight: 'calc(100vh - 200px)'
        }}
      >
        {/* Collapse/Expand tab */}
        <button
          onClick={() => setToolbarCollapsed(!toolbarCollapsed)}
          className={cn(
            "absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-12 flex items-center justify-center",
            "bg-card/90 backdrop-blur-xl rounded-l-xl border border-r-0 border-border/50",
            "text-muted-foreground hover:text-foreground transition-colors"
          )}
        >
          {toolbarCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Toolbar content */}
        <div className="bg-card/95 backdrop-blur-xl rounded-2xl shadow-lg border border-border/50 p-1.5 flex flex-col gap-1 overflow-y-auto">
          {/* Note actions */}
          <button 
            onClick={handleTogglePin}
            className={cn(
              'p-2.5 rounded-xl transition-colors',
              isPinned ? 'bg-pastel-amber/20 text-pastel-amber' : 'hover:bg-secondary text-muted-foreground'
            )}
          >
            <Pin className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => setShowFolderPicker(true)}
            className={cn(
              'p-2.5 rounded-xl transition-colors',
              folder ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-muted-foreground'
            )}
          >
            <Folder className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => setShowColorPicker(true)}
            className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground transition-colors"
          >
            <Palette className="w-4 h-4" />
          </button>

          {note && (
            <button 
              onClick={handleDelete}
              className="p-2.5 rounded-xl hover:bg-destructive/10 text-destructive transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <div className="w-full h-px bg-border my-1" />

          {/* Settings */}
          <button 
            onClick={() => setShowMetadata(!showMetadata)}
            className={cn(
              'p-2.5 rounded-xl transition-colors',
              showMetadata ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-muted-foreground'
            )}
          >
            <Settings className="w-4 h-4" />
          </button>

          <div className="w-full h-px bg-border my-1" />

          {/* Text formatting */}
          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn(
              'p-2.5 rounded-xl text-xs font-bold transition-colors',
              editor?.isActive('heading', { level: 1 }) ? 'bg-secondary text-foreground' : 'hover:bg-secondary text-muted-foreground'
            )}
          >
            H1
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(
              'p-2.5 rounded-xl text-xs font-semibold transition-colors',
              editor?.isActive('heading', { level: 2 }) ? 'bg-secondary text-foreground' : 'hover:bg-secondary text-muted-foreground'
            )}
          >
            H2
          </button>
          <button
            onClick={() => editor?.chain().focus().setParagraph().run()}
            className={cn(
              'p-2.5 rounded-xl text-xs transition-colors',
              editor?.isActive('paragraph') && !editor?.isActive('heading') ? 'bg-secondary text-foreground' : 'hover:bg-secondary text-muted-foreground'
            )}
          >
            T
          </button>

          <div className="w-full h-px bg-border my-1" />

          <button 
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={cn(
              'p-2.5 rounded-xl transition-colors',
              editor?.isActive('bold') ? 'bg-secondary text-foreground' : 'hover:bg-secondary text-muted-foreground'
            )}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button 
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={cn(
              'p-2.5 rounded-xl transition-colors',
              editor?.isActive('italic') ? 'bg-secondary text-foreground' : 'hover:bg-secondary text-muted-foreground'
            )}
          >
            <Italic className="w-4 h-4" />
          </button>

          <div className="w-full h-px bg-border my-1" />

          <button 
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={cn(
              'p-2.5 rounded-xl transition-colors',
              editor?.isActive('bulletList') ? 'bg-secondary text-foreground' : 'hover:bg-secondary text-muted-foreground'
            )}
          >
            <List className="w-4 h-4" />
          </button>
          <button 
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={cn(
              'p-2.5 rounded-xl transition-colors',
              editor?.isActive('orderedList') ? 'bg-secondary text-foreground' : 'hover:bg-secondary text-muted-foreground'
            )}
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button 
            onClick={() => editor?.chain().focus().toggleTaskList().run()}
            className={cn(
              'p-2.5 rounded-xl transition-colors',
              editor?.isActive('taskList') ? 'bg-secondary text-foreground' : 'hover:bg-secondary text-muted-foreground'
            )}
          >
            <CheckSquare className="w-4 h-4" />
          </button>

          <div className="w-full h-px bg-border my-1" />

          {/* Text alignment - cycling button */}
          <button 
            onClick={cycleAlignment}
            className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground transition-colors"
          >
            <AlignIcon className="w-4 h-4" />
          </button>

          <div className="w-full h-px bg-border my-1" />

          {/* Highlight */}
          <Popover open={showHighlightPicker} onOpenChange={setShowHighlightPicker}>
            <PopoverTrigger asChild>
              <button 
                className={cn(
                  'p-2.5 rounded-xl transition-colors',
                  editor?.isActive('highlight') ? 'bg-secondary text-foreground' : 'hover:bg-secondary text-muted-foreground'
                )}
              >
                <Highlighter className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="end" side="left">
              <div className="flex flex-wrap gap-2 max-w-[200px]">
                {pastelColors.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => handleHighlight(c.value)}
                    className={cn(
                      'w-7 h-7 rounded-full transition-all',
                      c.class,
                      'hover:scale-110'
                    )}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Click-outside overlay to close metadata */}
      {showMetadata && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMetadata(false)} 
        />
      )}

      {/* Metadata Section (popup from toolbar) */}
      {showMetadata && (
        <div 
          className="fixed right-16 border border-border bg-card/95 backdrop-blur-xl rounded-2xl px-4 py-4 space-y-3 z-50 shadow-lg min-w-[280px] transition-all"
          style={{ bottom: keyboardHeight + 120 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Date picker */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Date</span>
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary text-sm">
                  <Calendar className="w-4 h-4" />
                  {format(date, 'd MMM yyyy', { locale: sv })}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Show in calendar toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Show in calendar</span>
            </div>
            <button
              onClick={() => setShowInCalendar(!showInCalendar)}
              className={cn(
                'w-11 h-6 rounded-full transition-colors relative',
                showInCalendar ? 'bg-primary' : 'bg-secondary'
              )}
            >
              <span 
                className={cn(
                  'absolute top-1 w-4 h-4 rounded-full bg-card transition-transform',
                  showInCalendar ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
          
          {/* Hide from all notes toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Hide from All Notes</span>
            </div>
            <button
              onClick={() => setHideFromAllNotes(!hideFromAllNotes)}
              className={cn(
                'w-11 h-6 rounded-full transition-colors relative',
                hideFromAllNotes ? 'bg-primary' : 'bg-secondary'
              )}
            >
              <span 
                className={cn(
                  'absolute top-1 w-4 h-4 rounded-full bg-card transition-transform',
                  hideFromAllNotes ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </div>
      )}

      {/* Folder Picker Sheet */}
      <FolderPickerSheet
        isOpen={showFolderPicker}
        onClose={() => setShowFolderPicker(false)}
        selectedFolder={folder}
        onSelectFolder={(f) => {
          setFolder(f);
          setShowFolderPicker(false);
        }}
      />

      {/* Color Picker Sheet */}
      <ColorPickerSheet
        isOpen={showColorPicker}
        onClose={() => setShowColorPicker(false)}
        selectedColor={color}
        onSelectColor={(c) => {
          setColor(c);
          setShowColorPicker(false);
        }}
      />
    </div>
  );
}