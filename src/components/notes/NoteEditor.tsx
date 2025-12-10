import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
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
  Settings
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
    const colorMap: Record<PastelColor, string> = {
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
    editor?.chain().focus().toggleHighlight({ color: colorMap[highlightColor] }).run();
    setShowHighlightPicker(false);
  };

  const selectedFolder = folders.find(f => f.name === folder);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-xl">
        <button 
          onClick={handleSave}
          className="flex items-center gap-1 text-primary font-medium text-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Done</span>
        </button>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setShowFolderPicker(true)}
            className={cn(
              'p-2.5 rounded-xl transition-colors',
              folder ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
            )}
          >
            <Folder className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setShowColorPicker(true)}
            className={cn(
              'p-2.5 rounded-xl transition-colors',
              color ? `bg-pastel-${color}/30 text-pastel-${color}` : 'bg-secondary text-muted-foreground'
            )}
          >
            <Palette className="w-5 h-5" />
          </button>
          
          <button 
            onClick={handleTogglePin}
            className={cn(
              'p-2.5 rounded-xl transition-colors',
              isPinned ? 'bg-pastel-amber/20 text-pastel-amber' : 'bg-secondary text-muted-foreground'
            )}
          >
            <Pin className="w-5 h-5" />
          </button>
          
          {note && (
            <button 
              onClick={handleDelete}
              className="p-2.5 rounded-xl bg-destructive/10 text-destructive"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ paddingBottom: keyboardHeight > 0 ? '140px' : '100px' }}
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-2xl font-bold bg-transparent border-0 outline-none text-foreground mb-4"
          placeholder="Note title"
        />
        
        {/* Folder & Date info */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
          {folder && (
            <span className={cn('flow-badge', selectedFolder ? `flow-badge-${selectedFolder.color}` : 'flow-badge-gray')}>
              {folder}
            </span>
          )}
          <span>{format(date, 'MMM d, yyyy')}</span>
        </div>
        
        {/* TipTap Editor */}
        <EditorContent editor={editor} className="tiptap-content" />
      </div>

      {/* Click-outside overlay to close metadata */}
      {showMetadata && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMetadata(false)} 
        />
      )}

      {/* Metadata Section (collapsible) - inside toolbar area */}
      {showMetadata && (
        <div 
          className="fixed left-0 right-0 border-t border-border bg-card/95 backdrop-blur-xl px-4 py-4 space-y-3 z-50 transition-all"
          style={{ bottom: keyboardHeight + 52 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Date picker */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Date</span>
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary text-sm">
                  <Calendar className="w-4 h-4" />
                  {format(date, 'MMM d, yyyy')}
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

      {/* Formatting Toolbar - Keyboard Aware */}
      <div 
        className="fixed left-0 right-0 border-t border-border bg-card/95 backdrop-blur-xl px-2 py-2 z-50 transition-all"
        style={{ bottom: keyboardHeight }}
      >
        <div className="flex items-center gap-1 overflow-x-auto safe-bottom">
          {/* Settings button */}
          <button 
            onClick={() => setShowMetadata(!showMetadata)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showMetadata ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            )}
          >
            <Settings className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Text Size */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5">
            <button
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              className={cn(
                'px-2 py-1.5 rounded-md text-xs font-bold transition-colors',
                editor?.isActive('heading', { level: 1 }) ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              H1
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              className={cn(
                'px-2 py-1.5 rounded-md text-xs font-semibold transition-colors',
                editor?.isActive('heading', { level: 2 }) ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              H2
            </button>
            <button
              onClick={() => editor?.chain().focus().setParagraph().run()}
              className={cn(
                'px-2 py-1.5 rounded-md text-xs transition-colors',
                editor?.isActive('paragraph') && !editor?.isActive('heading') ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              T
            </button>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Formatting */}
          <button 
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={cn(
              'p-2 rounded-lg transition-colors',
              editor?.isActive('bold') ? 'bg-secondary text-foreground' : 'hover:bg-secondary text-muted-foreground'
            )}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button 
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={cn(
              'p-2 rounded-lg transition-colors',
              editor?.isActive('italic') ? 'bg-secondary text-foreground' : 'hover:bg-secondary text-muted-foreground'
            )}
          >
            <Italic className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Lists */}
          <button 
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={cn(
              'p-2 rounded-lg transition-colors',
              editor?.isActive('bulletList') ? 'bg-secondary text-foreground' : 'hover:bg-secondary text-muted-foreground'
            )}
          >
            <List className="w-4 h-4" />
          </button>
          <button 
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={cn(
              'p-2 rounded-lg transition-colors',
              editor?.isActive('orderedList') ? 'bg-secondary text-foreground' : 'hover:bg-secondary text-muted-foreground'
            )}
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button 
            onClick={() => editor?.chain().focus().toggleTaskList().run()}
            className={cn(
              'p-2 rounded-lg transition-colors',
              editor?.isActive('taskList') ? 'bg-secondary text-foreground' : 'hover:bg-secondary text-muted-foreground'
            )}
          >
            <CheckSquare className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Highlight */}
          <Popover open={showHighlightPicker} onOpenChange={setShowHighlightPicker}>
            <PopoverTrigger asChild>
              <button 
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  editor?.isActive('highlight') ? 'bg-secondary text-foreground' : 'hover:bg-secondary text-muted-foreground'
                )}
              >
                <Highlighter className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="end">
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
