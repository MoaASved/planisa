import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
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
  ChevronDown,
  ChevronUp,
  Type
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

type TextSize = 'heading' | 'subheading' | 'body';

export function NoteEditor({ note, onClose }: NoteEditorProps) {
  const { addNote, updateNote, deleteNote, togglePinNote, folders } = useAppStore();
  
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [folder, setFolder] = useState<string | undefined>(note?.folder);
  const [color, setColor] = useState<PastelColor | undefined>(note?.color);
  const [date, setDate] = useState<Date>(note?.date ? new Date(note.date) : new Date());
  const [isPinned, setIsPinned] = useState(note?.isPinned || false);
  const [showInCalendar, setShowInCalendar] = useState(note?.showInCalendar || false);
  const [hideFromAllNotes, setHideFromAllNotes] = useState(note?.hideFromAllNotes || false);
  
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [activeTextSize, setActiveTextSize] = useState<TextSize>('body');
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus title on new note
    if (!note && titleRef.current) {
      titleRef.current.focus();
    }
  }, [note]);

  const handleSave = () => {
    const noteData = {
      title: title.trim() || 'Untitled',
      content,
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

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
    setContent(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleBold = () => insertFormatting('**', '**');
  const handleItalic = () => insertFormatting('*', '*');
  const handleBulletList = () => insertFormatting('\n- ');
  const handleNumberedList = () => insertFormatting('\n1. ');
  const handleCheckbox = () => insertFormatting('\n- [ ] ');

  const handleTextSize = (size: TextSize) => {
    setActiveTextSize(size);
    const prefixMap: Record<TextSize, string> = {
      heading: '## ',
      subheading: '### ',
      body: '',
    };
    insertFormatting('\n' + prefixMap[size]);
  };

  const handleHighlight = (highlightColor: PastelColor) => {
    // We'll use a simple marker format: ==text==
    insertFormatting('==', '==');
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
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <input
          ref={titleRef}
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
        
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full min-h-[300px] bg-transparent border-0 outline-none text-foreground resize-none leading-relaxed text-base"
          placeholder="Start writing..."
        />
      </div>

      {/* Metadata Section (collapsible) */}
      <div className="border-t border-border bg-card/50">
        <button 
          onClick={() => setShowMetadata(!showMetadata)}
          className="w-full px-4 py-3 flex items-center justify-between text-sm text-muted-foreground"
        >
          <span>Settings</span>
          {showMetadata ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
        
        {showMetadata && (
          <div className="px-4 pb-4 space-y-3">
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
      </div>

      {/* Formatting Toolbar */}
      <div className="border-t border-border bg-card px-2 py-2 safe-bottom">
        <div className="flex items-center gap-1 overflow-x-auto">
          {/* Text Size */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5 mr-1">
            <button
              onClick={() => handleTextSize('heading')}
              className={cn(
                'px-2 py-1.5 rounded-md text-xs font-bold transition-colors',
                activeTextSize === 'heading' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              H1
            </button>
            <button
              onClick={() => handleTextSize('subheading')}
              className={cn(
                'px-2 py-1.5 rounded-md text-xs font-semibold transition-colors',
                activeTextSize === 'subheading' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              H2
            </button>
            <button
              onClick={() => handleTextSize('body')}
              className={cn(
                'px-2 py-1.5 rounded-md text-xs transition-colors',
                activeTextSize === 'body' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              T
            </button>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Formatting */}
          <button onClick={handleBold} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <Bold className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={handleItalic} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <Italic className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Lists */}
          <button onClick={handleBulletList} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <List className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={handleNumberedList} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ListOrdered className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={handleCheckbox} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <CheckSquare className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Highlight */}
          <Popover open={showHighlightPicker} onOpenChange={setShowHighlightPicker}>
            <PopoverTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <Highlighter className="w-4 h-4 text-muted-foreground" />
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
