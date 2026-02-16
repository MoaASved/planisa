import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';
import { DraggableImage } from './DraggableImage';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Folder, 
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
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Mic,
  Plus,
  Undo2,
  Redo2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { Note, PastelColor } from '@/types';
import { FolderPickerSheet } from './FolderPickerSheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useUndoableDelete } from '@/hooks/useUndoableDelete';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { pastelColors } from '@/lib/colors';
import { compressImage } from '@/lib/mediaUtils';
import { VoiceRecordingModal } from './VoiceRecordingModal';
import { VoiceNoteExtension, insertVoiceNote } from './VoiceNoteExtension';

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
  const { addNote, updateNote, togglePinNote, folders } = useAppStore();
  const { deleteWithUndo } = useUndoableDelete();
  
  const [title, setTitle] = useState(note?.title || '');
  const [folder, setFolder] = useState<string | undefined>(note?.folder);
  const [date, setDate] = useState<Date>(note?.date ? new Date(note.date) : new Date());
  const [time, setTime] = useState<string | undefined>(note?.time);
  const [endTime, setEndTime] = useState<string | undefined>(note?.endTime);
  const [isPinned, setIsPinned] = useState(note?.isPinned || false);
  const endTimeManuallySet = useRef(false);

  const calculateEndTime = (start: string): string => {
    const [h, m] = start.split(':').map(Number);
    const endH = Math.min(h + 1, 23);
    const endMin = h + 1 > 23 ? 59 : m;
    return `${String(endH).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
  };
  const [showInCalendar, setShowInCalendar] = useState(note?.showInCalendar || false);

  // Auto-calculate endTime when it's missing and start time exists
  useEffect(() => {
    if (showInCalendar && time && !endTime && !endTimeManuallySet.current) {
      setEndTime(calculateEndTime(time));
    }
  }, [showInCalendar, time, endTime]);
  const [hideFromAllNotes, setHideFromAllNotes] = useState(note?.hideFromAllNotes || false);
  const [hideDate, setHideDate] = useState(note?.hideDate || false);
  
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

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
      DraggableImage,
      VoiceNoteExtension,
    ],
    content: note?.content || '',
    editorProps: {
      attributes: {
        class: 'tiptap-editor prose prose-sm min-h-[300px] outline-none max-w-none',
      },
    },
  });

  const handleSave = () => {
    const noteData = {
      title: title.trim() || 'Untitled',
      content: editor?.getHTML() || '',
      type: note?.type || 'note' as const,
      folder,
      color: undefined, // Regular notes don't have color
      date,
      time: showInCalendar ? time : undefined,
      endTime: showInCalendar && time ? endTime : undefined,
      tags: [],
      isPinned,
      showInCalendar,
      hideFromAllNotes,
      hideDate,
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
      deleteWithUndo('note', note);
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

  // Toolbar button component - Apple-inspired with subtle animations
  const ToolbarBtn = ({
    onClick, 
    active, 
    disabled,
    children, 
    className,
    destructive
  }: { 
    onClick: () => void; 
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    className?: string;
    destructive?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'p-1.5 rounded-lg transition-all duration-150 active:scale-90',
        disabled && 'opacity-30 cursor-not-allowed active:scale-100',
        active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-black/5',
        destructive && 'hover:bg-destructive/10 text-destructive',
        className
      )}
    >
      {children}
    </button>
  );

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#F8F7F4] dark:bg-background flex flex-col animate-fade-in"
    >
      {/* Top Horizontal Toolbar - Collapsible */}
      <div className="flex-shrink-0">
        {/* Collapsed state - discrete tab */}
        {toolbarCollapsed ? (
          <div className="flex justify-center py-2">
            <button
              onClick={() => setToolbarCollapsed(false)}
              className="flex items-center justify-center w-10 h-6 rounded-full bg-white/80 backdrop-blur-sm shadow-sm text-muted-foreground hover:bg-white active:scale-95 transition-all duration-200"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
            {/* Toolbar content */}
            <div className="flex items-center justify-between px-2 py-1.5 gap-2">
              {/* Left group: Undo/Redo + Note actions */}
              <div className="flex items-center gap-0.5">
                <ToolbarBtn 
                  onClick={() => editor?.chain().focus().undo().run()}
                  disabled={!editor?.can().undo()}
                >
                  <Undo2 className="w-4 h-4" />
                </ToolbarBtn>
                <ToolbarBtn 
                  onClick={() => editor?.chain().focus().redo().run()}
                  disabled={!editor?.can().redo()}
                >
                  <Redo2 className="w-4 h-4" />
                </ToolbarBtn>
                
                <div className="w-px h-4 bg-border mx-1" />
                
                <ToolbarBtn onClick={handleTogglePin} active={isPinned}>
                  <Pin className="w-4 h-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => setShowFolderPicker(true)} active={!!folder}>
                  <Folder className="w-4 h-4" />
                </ToolbarBtn>
              </div>

              {/* Center group: Format dropdown + Bold + Italic */}
              <div className="flex items-center gap-0.5">
                {/* Format dropdown (Aa) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-0.5 px-2 py-1.5 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-all active:scale-95">
                      <span className="text-sm font-medium">Aa</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="min-w-[140px]">
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
                
                <ToolbarBtn 
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  active={editor?.isActive('bold')}
                >
                  <Bold className="w-4 h-4" />
                </ToolbarBtn>
                <ToolbarBtn 
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  active={editor?.isActive('italic')}
                >
                  <Italic className="w-4 h-4" />
                </ToolbarBtn>
              </div>

              {/* Right group: Insert dropdown + Settings + Delete + Collapse */}
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
                    <DropdownMenuItem onClick={() => setShowHighlightPicker(true)}>
                      <Highlighter className="w-4 h-4 mr-2" />
                      <span>Highlight</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <ToolbarBtn onClick={() => setShowMetadata(!showMetadata)} active={showMetadata}>
                  <Settings className="w-4 h-4" />
                </ToolbarBtn>
                
                {note && (
                  <ToolbarBtn onClick={handleDelete} destructive>
                    <Trash2 className="w-4 h-4" />
                  </ToolbarBtn>
                )}
                
                <button
                  onClick={() => setToolbarCollapsed(true)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-colors"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Header - Back arrow with white circular background */}
      <div className="flex-shrink-0 flex items-center px-4 py-2">
        <button 
          onClick={handleSave}
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-foreground hover:bg-gray-50 active:scale-95 transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Date and Folder centered */}
      <div className="flex-shrink-0 flex flex-col items-center px-4 pb-2">
        {!hideDate && (
          <span 
            className="text-sm font-medium text-muted-foreground"
          >
            {format(date, 'MMMM d, yyyy')}
          </span>
        )}
        {folder && (
          <span className={cn("px-3 py-1 rounded-full bg-white shadow-sm text-xs font-medium text-muted-foreground", !hideDate && "mt-1.5")}>
            {folder}
          </span>
        )}
      </div>

      {/* Content - scrollable independently */}
      <div className="flex-1 overflow-y-auto px-4 pb-10">
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

      {/* Click-outside overlay to close metadata */}
      {showMetadata && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMetadata(false)} 
        />
      )}

      {/* Metadata Section (popup from settings button) */}
      {showMetadata && (
        <div 
          className="fixed left-4 right-4 top-16 border border-white/20 bg-white/95 backdrop-blur-xl rounded-2xl px-4 py-4 space-y-3 z-50 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-200"
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
              onClick={() => {
                const newValue = !showInCalendar;
                setShowInCalendar(newValue);
                if (!newValue) {
                  setTime(undefined);
                  setEndTime(undefined);
                }
              }}
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
          
          {/* Start time picker - only shown when showInCalendar is enabled */}
          {showInCalendar && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Time</span>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={time || ''}
                  onChange={(e) => {
                    const val = e.target.value || undefined;
                    setTime(val);
                    if (!endTimeManuallySet.current && val) {
                      setEndTime(calculateEndTime(val));
                    }
                  }}
                  className="bg-secondary rounded-xl px-3 py-2 text-sm border-0 outline-none text-foreground"
                />
                {time && (
                  <button 
                    onClick={() => {
                      setTime(undefined);
                      setEndTime(undefined);
                    }}
                    className="p-1 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* End time picker - only shown when start time exists */}
          {showInCalendar && time && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">End time</span>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={endTime || ''}
                  onChange={(e) => {
                    endTimeManuallySet.current = true;
                    setEndTime(e.target.value || undefined);
                  }}
                  min={time}
                  className="bg-secondary rounded-xl px-3 py-2 text-sm border-0 outline-none text-foreground"
                />
                {endTime && (
                  <button 
                    onClick={() => {
                      endTimeManuallySet.current = false;
                      setEndTime(undefined);
                    }}
                    className="p-1 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Hide from all notes toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Hide from All Notes</span>
            </div>
            <button
              onClick={() => setHideFromAllNotes(!hideFromAllNotes)}
              className={cn(
                'w-11 h-6 rounded-full transition-all duration-200 flex items-center px-0.5',
                hideFromAllNotes ? 'bg-primary/20 border border-primary/40 justify-end' : 'bg-secondary/50 border border-border justify-start'
              )}
            >
              <span 
                className={cn(
                  'w-5 h-5 rounded-full transition-all duration-200 shadow-sm',
                  hideFromAllNotes ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
              />
            </button>
          </div>
          
          {/* Hide date toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Hide Date</span>
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

      {/* Voice Recording Modal */}
      <VoiceRecordingModal
        isOpen={showVoiceRecorder}
        onClose={() => setShowVoiceRecorder(false)}
        onRecordingComplete={handleVoiceRecordingComplete}
      />

    </div>
  );
}
