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
import Image from '@tiptap/extension-image';
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
  Mic
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { Note, PastelColor } from '@/types';
import { FolderPickerSheet } from './FolderPickerSheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  const { addNote, updateNote, deleteNote, togglePinNote, folders } = useAppStore();
  
  const [title, setTitle] = useState(note?.title || '');
  const [folder, setFolder] = useState<string | undefined>(note?.folder);
  const [date, setDate] = useState<Date>(note?.date ? new Date(note.date) : new Date());
  const [isPinned, setIsPinned] = useState(note?.isPinned || false);
  const [showInCalendar, setShowInCalendar] = useState(note?.showInCalendar || false);
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
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl max-w-full h-auto my-4 shadow-sm',
        },
      }),
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

  // Handle image upload
  const handleAddImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const compressedBase64 = await compressImage(file, 1200, 0.8);
          editor?.chain().focus().setImage({ src: compressedBase64 }).run();
        } catch (error) {
          console.error('Failed to process image:', error);
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
    children, 
    className,
    destructive
  }: { 
    onClick: () => void; 
    active?: boolean; 
    children: React.ReactNode;
    className?: string;
    destructive?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        'p-1.5 rounded-lg transition-all duration-150 active:scale-90',
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
            <div className="flex items-center justify-between px-2 py-1.5 gap-1 overflow-x-auto">
              {/* Left group: Note actions */}
              <div className="flex items-center gap-0.5">
                <ToolbarBtn onClick={handleTogglePin} active={isPinned}>
                  <Pin className="w-4 h-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => setShowFolderPicker(true)} active={!!folder}>
                  <Folder className="w-4 h-4" />
                </ToolbarBtn>
                {note && (
                  <ToolbarBtn onClick={handleDelete} destructive>
                    <Trash2 className="w-4 h-4" />
                  </ToolbarBtn>
                )}
                
                <div className="w-px h-5 bg-border/50 mx-1" />
                
                <ToolbarBtn onClick={() => setShowMetadata(!showMetadata)} active={showMetadata}>
                  <Settings className="w-4 h-4" />
                </ToolbarBtn>
              </div>

              {/* Center group: Text formatting */}
              <div className="flex items-center gap-0.5">
                <ToolbarBtn
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                  active={editor?.isActive('heading', { level: 1 })}
                  className="text-xs font-bold px-1.5"
                >
                  H1
                </ToolbarBtn>
                <ToolbarBtn
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  active={editor?.isActive('heading', { level: 2 })}
                  className="text-xs font-semibold px-1.5"
                >
                  H2
                </ToolbarBtn>
                <ToolbarBtn
                  onClick={() => editor?.chain().focus().setParagraph().run()}
                  active={editor?.isActive('paragraph') && !editor?.isActive('heading')}
                  className="text-xs px-1.5"
                >
                  T
                </ToolbarBtn>
                
                <div className="w-px h-5 bg-border/50 mx-1" />
                
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

              {/* Right group: Lists, alignment, highlight */}
              <div className="flex items-center gap-0.5">
                <ToolbarBtn 
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  active={editor?.isActive('bulletList')}
                >
                  <List className="w-4 h-4" />
                </ToolbarBtn>
                <ToolbarBtn 
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  active={editor?.isActive('orderedList')}
                >
                  <ListOrdered className="w-4 h-4" />
                </ToolbarBtn>
                <ToolbarBtn 
                  onClick={() => editor?.chain().focus().toggleTaskList().run()}
                  active={editor?.isActive('taskList')}
                >
                  <CheckSquare className="w-4 h-4" />
                </ToolbarBtn>
                
                <div className="w-px h-5 bg-border/50 mx-1" />
                
                <ToolbarBtn onClick={cycleAlignment}>
                  <AlignIcon className="w-4 h-4" />
                </ToolbarBtn>
                
                <Popover open={showHighlightPicker} onOpenChange={setShowHighlightPicker}>
                  <PopoverTrigger asChild>
                    <button 
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        editor?.isActive('highlight') ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50'
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
                            'w-6 h-6 rounded-full transition-all',
                            c.class,
                            'hover:scale-110'
                          )}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                
                <div className="w-px h-5 bg-border/50 mx-1" />
                
                {/* Media buttons */}
                <ToolbarBtn onClick={handleAddImage}>
                  <ImageIcon className="w-4 h-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => setShowVoiceRecorder(true)}>
                  <Mic className="w-4 h-4" />
                </ToolbarBtn>
                
                <div className="w-px h-5 bg-border/50 mx-1" />
                
                {/* Collapse button */}
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
            {format(date, 'd MMMM yyyy', { locale: sv })}
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
          
          {/* Hide date toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Hide Date</span>
            </div>
            <button
              onClick={() => setHideDate(!hideDate)}
              className={cn(
                'w-11 h-6 rounded-full transition-colors relative',
                hideDate ? 'bg-primary' : 'bg-secondary'
              )}
            >
              <span 
                className={cn(
                  'absolute top-1 w-4 h-4 rounded-full bg-card transition-transform',
                  hideDate ? 'translate-x-6' : 'translate-x-1'
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
