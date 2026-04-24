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
  FolderPlus,
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
  Redo2,
  Check
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
  coral: 'hsl(123, 10%, 51%)',
  peach: 'hsl(53, 24%, 69%)',
  amber: 'hsl(195, 29%, 53%)',
  yellow: 'hsl(196, 27%, 87%)',
  mint: 'hsl(20, 96%, 75%)',
  teal: 'hsl(33, 96%, 76%)',
  sky: 'hsl(1, 64%, 75%)',
  lavender: 'hsl(344, 48%, 67%)',
  rose: 'hsl(283, 18%, 57%)',
  gray: 'hsl(34, 19%, 58%)',
  stone: 'hsl(44, 16%, 85%)',
};

export function NoteEditor({ note, onClose }: NoteEditorProps) {
  const { addNote, updateNote, togglePinNote, folders, addFolder } = useAppStore();
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
  
  const [showInlineFolderCreate, setShowInlineFolderCreate] = useState(false);
  const [folderPopoverOpen, setFolderPopoverOpen] = useState(false);
  const [inlineFolderName, setInlineFolderName] = useState('');
  const [inlineFolderColor, setInlineFolderColor] = useState<PastelColor>('sky');
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [activeHighlightColor, setActiveHighlightColor] = useState<PastelColor | null>(null);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Force re-render on editor transactions so undo/redo buttons update
  const [, forceUpdate] = useState(0);

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
      scrollThreshold: 0,
      scrollMargin: 0,
    },
    onTransaction: () => {
      forceUpdate(n => n + 1);
    },
  });

  const handleCreateInlineFolder = () => {
    if (inlineFolderName.trim()) {
      addFolder({ name: inlineFolderName.trim(), color: inlineFolderColor });
      setFolder(inlineFolderName.trim());
      setInlineFolderName('');
      setInlineFolderColor('sky');
      setShowInlineFolderCreate(false);
      setFolderPopoverOpen(false);
    }
  };

  // Prevent the iOS keyboard from opening when the user taps a task-list checkbox.
  // Strategy:
  //   mousedown (capture) — prevents focus on desktop & synthesized touch events.
  //   touchend  (capture) — earlier iOS hook; preventDefault stops the focus chain
  //                         before the synthesized click; we then flip the checkbox
  //                         state and dispatch 'change' so TipTap's own handler runs.
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;

    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t instanceof HTMLInputElement && t.type === 'checkbox') {
        e.preventDefault();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const t = e.target as HTMLElement;
      if (!(t instanceof HTMLInputElement) || t.type !== 'checkbox') return;
      e.preventDefault(); // Block focus / keyboard on iOS
      // Flip the visual state and fire 'change' so TipTap's NodeView handler
      // receives it and updates the document without the editor gaining focus.
      t.checked = !t.checked;
      t.dispatchEvent(new Event('change', { bubbles: true }));
    };

    dom.addEventListener('mousedown', onMouseDown, true);
    dom.addEventListener('touchend', onTouchEnd, { capture: true, passive: false });
    return () => {
      dom.removeEventListener('mousedown', onMouseDown, true);
      dom.removeEventListener('touchend', onTouchEnd, true);
    };
  }, [editor]);

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
    const hasSelection = editor && !editor.state.selection.empty;
    if (hasSelection) {
      // Apply highlight to current selection
      editor?.chain().focus().setHighlight({ color: colorHslMap[highlightColor] }).run();
      setActiveHighlightColor(null);
    } else {
      // Activate highlight pen mode
      setActiveHighlightColor(highlightColor);
    }
    setShowHighlightPicker(false);
  };

  const handleRemoveHighlight = () => {
    editor?.chain().focus().unsetHighlight().run();
    setActiveHighlightColor(null);
    setShowHighlightPicker(false);
  };

  // Highlight pen mode: auto-apply on selection
  useEffect(() => {
    if (!editor || !activeHighlightColor) return;
    const handler = ({ editor: e }: { editor: typeof editor }) => {
      if (e && !e.state.selection.empty) {
        e.chain().setHighlight({ color: colorHslMap[activeHighlightColor] }).run();
      }
    };
    editor.on('selectionUpdate', handler as any);
    return () => { editor.off('selectionUpdate', handler as any); };
  }, [editor, activeHighlightColor]);

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
    destructive,
    preventFocusLoss = false,
  }: { 
    onClick: () => void; 
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    className?: string;
    destructive?: boolean;
    preventFocusLoss?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={preventFocusLoss ? (e) => e.preventDefault() : undefined}
      className={cn(
        'p-1.5 rounded-lg transition-all duration-150 active:scale-90',
        disabled && 'opacity-30 cursor-not-allowed active:scale-100',
        active ? 'bg-primary/15 text-primary font-semibold shadow-sm' : 'text-muted-foreground hover:bg-black/5',
        destructive && 'hover:bg-destructive/10 text-destructive',
        className
      )}
    >
      {children}
    </button>
  );

  // Track visual viewport so toolbar stays above the iOS keyboard
  const [viewportOffset, setViewportOffset] = useState(0);
  // Initialise from visualViewport so we get the correct value even before the
  // first resize event (avoids a flash on iOS when Safari chrome changes height)
  const [viewportHeight, setViewportHeight] = useState(
    () => window.visualViewport?.height ?? window.innerHeight
  );
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      setViewportOffset(vv.offsetTop);
      setViewportHeight(vv.height);
      // After the next paint (when padding has been applied) scroll the
      // cursor back into view so it is never hidden behind the keyboard.
      requestAnimationFrame(() => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const node = sel.getRangeAt(0).startContainer;
        const el = (node.nodeType === Node.TEXT_NODE
          ? (node as Text).parentElement
          : node) as Element | null;
        el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    };
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, []);

  // How many px of screen are obscured by the keyboard right now
  const keyboardHeight = Math.max(0, window.innerHeight - viewportHeight - viewportOffset);
  // Toolbar sits 26 px above the keyboard (or 26 px above screen-bottom when no keyboard)
  const toolbarBottom = keyboardHeight + 26;
  // Content bottom-padding = keyboard + toolbar height + comfortable gap
  // Math.max keeps at least the original pb-24 (96 px) when keyboard is closed
  const contentPaddingBottom = Math.max(96, keyboardHeight + (toolbarCollapsed ? 34 : 56) + 20);

  return (
    <div 
      className="fixed inset-0 z-[1100] bg-[#F8F7F4] dark:bg-background flex flex-col animate-fade-in"
    >
      {/* Fixed Floating Toolbar */}
      <div
        className="fixed left-1/2 -translate-x-1/2 w-[calc(100%-32px)] z-[1250]"
        style={{ bottom: `${toolbarBottom}px` }}
      >
        {toolbarCollapsed ? null : (
          <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
            {/* Toolbar content */}
            <div className="flex items-center justify-between px-2 py-1.5 gap-2">
              {/* Left group: Undo/Redo + Note actions */}
              <div className="flex items-center gap-0.5">
                <ToolbarBtn 
                  onClick={() => editor?.chain().focus().undo().run()}
                  disabled={!editor?.can().undo()}
                  preventFocusLoss
                >
                  <Undo2 className="w-4 h-4" />
                </ToolbarBtn>
                <ToolbarBtn 
                  onClick={() => editor?.chain().focus().redo().run()}
                  disabled={!editor?.can().redo()}
                  preventFocusLoss
                >
                  <Redo2 className="w-4 h-4" />
                </ToolbarBtn>
                
                <div className="w-px h-4 bg-border mx-1" />
                
                <ToolbarBtn onClick={handleTogglePin} active={isPinned}>
                  <Pin className="w-4 h-4" />
                </ToolbarBtn>
                <Popover
                  open={folderPopoverOpen}
                  onOpenChange={(open) => {
                    setFolderPopoverOpen(open);
                    if (!open) {
                      setShowInlineFolderCreate(false);
                      setInlineFolderName('');
                      setInlineFolderColor('sky');
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      className={cn(
                        'p-1.5 rounded-lg transition-all duration-150 active:scale-90',
                        folder ? 'bg-primary/15 text-primary shadow-sm' : 'text-muted-foreground hover:bg-black/5'
                      )}
                    >
                      <Folder className="w-4 h-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="top" align="start" sideOffset={8} className="w-[200px] p-1 z-[1300]">
                    {!showInlineFolderCreate ? (
                      <div>
                        {folder && (
                          <>
                            <button
                              onClick={() => { setFolder(undefined); setFolderPopoverOpen(false); }}
                              className="w-full text-left px-2 py-1.5 text-sm text-muted-foreground hover:bg-secondary rounded-md"
                            >
                              No folder
                            </button>
                            <div className="h-px bg-border my-1" />
                          </>
                        )}
                        {folders.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => { setFolder(f.name); setFolderPopoverOpen(false); }}
                            className={cn('w-full text-left flex items-center px-2 py-1.5 text-sm rounded-md hover:bg-secondary', folder === f.name && 'bg-secondary')}
                          >
                            <div className={cn('w-2.5 h-2.5 rounded-full mr-2 shrink-0', `bg-pastel-${f.color}`)} />
                            <span>{f.name}</span>
                            {folder === f.name && <Check className="w-4 h-4 ml-auto" />}
                          </button>
                        ))}
                        {folders.length > 0 && <div className="h-px bg-border my-1" />}
                        <button
                          onClick={() => setShowInlineFolderCreate(true)}
                          className="w-full text-left flex items-center px-2 py-1.5 text-sm text-muted-foreground hover:bg-secondary rounded-md"
                        >
                          <FolderPlus className="w-4 h-4 mr-2" />
                          <span>New folder</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-2 space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Folder</p>
                        <input
                          type="text"
                          value={inlineFolderName}
                          onChange={(e) => setInlineFolderName(e.target.value)}
                          placeholder="Folder name"
                          className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm border-0 outline-none text-foreground placeholder:text-muted-foreground"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateInlineFolder();
                            if (e.key === 'Escape') setShowInlineFolderCreate(false);
                          }}
                        />
                        <div className="flex flex-wrap gap-2">
                          {pastelColors.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => setInlineFolderColor(c.value)}
                              className={cn(
                                'w-6 h-6 rounded-full transition-all',
                                c.class,
                                inlineFolderColor === c.value && 'ring-2 ring-offset-2 ring-primary'
                              )}
                            />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowInlineFolderCreate(false)}
                            className="flex-1 py-2 rounded-xl bg-secondary text-sm font-medium text-foreground hover:bg-muted transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleCreateInlineFolder}
                            className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                          >
                            Create
                          </button>
                        </div>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Center group: Format dropdown + Bold + Italic */}
              <div className="flex items-center gap-0.5">
                {/* Format dropdown (Aa) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button onMouseDown={(e) => e.preventDefault()} className="flex items-center gap-0.5 px-2 py-1.5 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-all active:scale-95">
                      <span className="text-sm font-medium">Aa</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="min-w-[140px] z-[1300]">
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
                  preventFocusLoss
                >
                  <Bold className="w-4 h-4" />
                </ToolbarBtn>
                <ToolbarBtn 
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  active={editor?.isActive('italic')}
                  preventFocusLoss
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
                  <DropdownMenuContent align="end" className="min-w-[160px] z-[1300]">
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
                      {activeHighlightColor && (
                        <span className="ml-auto w-3 h-3 rounded-full" style={{ background: colorHslMap[activeHighlightColor] }} />
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      className="p-1.5 rounded-lg transition-all duration-150 active:scale-90 text-muted-foreground hover:bg-black/5"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    align="end"
                    className="w-72 p-4 space-y-3 z-[1300]"
                    onCloseAutoFocus={(e) => e.preventDefault()}
                  >
                    {/* Date picker */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Date</span>
                      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary text-sm">
                            <Calendar className="w-4 h-4" />
                            {format(date, 'MMM d, yyyy')}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-[9999]" align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
                          <CalendarComponent
                            mode="single"
                            selected={date}
                            onSelect={(d) => { if (d) setDate(d); }}
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
                          if (!newValue) { setTime(undefined); setEndTime(undefined); }
                        }}
                        className={cn(
                          'w-11 h-6 rounded-full transition-all duration-200 flex items-center px-0.5',
                          showInCalendar ? 'bg-primary/20 border border-primary/40 justify-end' : 'bg-secondary/50 border border-border justify-start'
                        )}
                      >
                        <span className={cn('w-5 h-5 rounded-full transition-all duration-200 shadow-sm', showInCalendar ? 'bg-primary' : 'bg-muted-foreground/30')} />
                      </button>
                    </div>

                    {/* Time picker */}
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
                              if (!endTimeManuallySet.current && val) setEndTime(calculateEndTime(val));
                            }}
                            className="bg-secondary rounded-xl px-3 py-2 text-sm border-0 outline-none text-foreground"
                          />
                          {time && (
                            <button onClick={() => { setTime(undefined); setEndTime(undefined); }} className="p-1 rounded-lg hover:bg-secondary transition-colors">
                              <EyeOff className="w-4 h-4 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* End time picker */}
                    {showInCalendar && time && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">End time</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={endTime || ''}
                            onChange={(e) => { endTimeManuallySet.current = true; setEndTime(e.target.value || undefined); }}
                            min={time}
                            className="bg-secondary rounded-xl px-3 py-2 text-sm border-0 outline-none text-foreground"
                          />
                          {endTime && (
                            <button onClick={() => { endTimeManuallySet.current = false; setEndTime(undefined); }} className="p-1 rounded-lg hover:bg-secondary transition-colors">
                              <EyeOff className="w-4 h-4 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Hide from All Notes toggle */}
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
                        <span className={cn('w-5 h-5 rounded-full transition-all duration-200 shadow-sm', hideFromAllNotes ? 'bg-primary' : 'bg-muted-foreground/30')} />
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
                        <span className={cn('w-5 h-5 rounded-full transition-all duration-200 shadow-sm', hideDate ? 'bg-primary' : 'bg-muted-foreground/30')} />
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
                
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

        {/* Toolbar toggle tab - only when collapsed */}
        {toolbarCollapsed && (
          <div className="flex justify-center pt-1">
            <button
              onClick={() => setToolbarCollapsed(false)}
              className="flex items-center justify-center w-10 h-6 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-muted-foreground hover:bg-white active:scale-95 transition-all duration-200"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Highlight color picker panel */}
      {showHighlightPicker && (
        <>
          <div className="fixed inset-0 z-[1260]" onClick={() => setShowHighlightPicker(false)} />
          <div className="fixed left-1/2 -translate-x-1/2 w-[calc(100%-32px)] z-[1300]" style={{ bottom: `${toolbarBottom + 56}px` }}>
            <div className="bg-background rounded-2xl shadow-lg p-3 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Highlighter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Highlight</span>
                {activeHighlightColor && (
                  <span className="text-xs text-primary ml-auto">Pen mode active</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {pastelColors.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => handleHighlight(c.value)}
                    className={cn(
                      'w-8 h-8 rounded-full transition-all',
                      activeHighlightColor === c.value && 'ring-2 ring-offset-2 ring-primary'
                    )}
                    style={{ background: colorHslMap[c.value] }}
                  />
                ))}
              </div>
              <button
                onClick={handleRemoveHighlight}
                className="mt-2 w-full text-sm text-muted-foreground hover:text-foreground py-1.5 rounded-xl hover:bg-secondary transition-colors"
              >
                Remove highlight
              </button>
            </div>
          </div>
        </>
      )}
      <div
        className="flex-1 overflow-y-auto px-4"
        style={{ paddingBottom: `${contentPaddingBottom}px` }}
      >

        {/* Header - Back arrow */}
        <div className="flex items-center pt-12 pb-4">
          <button
            onClick={handleSave}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-foreground hover:bg-gray-50 active:scale-95 transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Date and Folder centered */}
        <div className="flex flex-col items-center pb-2">
          {!hideDate && (
            <span className="text-sm font-medium text-muted-foreground">
              {format(date, 'MMMM d, yyyy')}
            </span>
          )}
          {folder && (
            <span className={cn("px-3 py-1 rounded-full bg-white shadow-sm text-xs font-medium text-muted-foreground", !hideDate && "mt-1.5")}>
              {folder}
            </span>
          )}
        </div>

        {/* Title input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={(e) => e.target.scrollIntoView = () => {}}
          className="w-full text-2xl font-bold bg-transparent border-0 outline-none text-foreground mb-4 text-center"
          placeholder="Note title"
        />
        
        {/* TipTap Editor */}
        <EditorContent editor={editor} className="tiptap-content" />
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
