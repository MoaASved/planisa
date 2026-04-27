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
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Mic,
  Plus,
  Undo2,
  Check,
  MoreHorizontal,
  ChevronRight,
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

  useEffect(() => {
    if (showInCalendar && time && !endTime && !endTimeManuallySet.current) {
      setEndTime(calculateEndTime(time));
    }
  }, [showInCalendar, time, endTime]);

  const [hideFromAllNotes, setHideFromAllNotes] = useState(note?.hideFromAllNotes || false);
  const [hideDate, setHideDate] = useState(note?.hideDate || false);

  const [morePopoverOpen, setMorePopoverOpen] = useState(false);
  const [moreView, setMoreView] = useState<'main' | 'folder' | 'folder-create'>('main');
  const [inlineFolderName, setInlineFolderName] = useState('');
  const [inlineFolderColor, setInlineFolderColor] = useState<PastelColor>('sky');
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [activeHighlightColor, setActiveHighlightColor] = useState<PastelColor | null>(null);
  const [removeHighlightMode, setRemoveHighlightMode] = useState(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const [, forceUpdate] = useState(0);
  const [viewportOffset, setViewportOffset] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(() => window.visualViewport?.height ?? window.innerHeight);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onUpdate = () => {
      setViewportOffset(vv.offsetTop);
      setViewportHeight(vv.height);
    };
    vv.addEventListener('resize', onUpdate);
    vv.addEventListener('scroll', onUpdate);
    return () => {
      vv.removeEventListener('resize', onUpdate);
      vv.removeEventListener('scroll', onUpdate);
    };
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2] } }),
      Highlight.configure({ multicolor: true, HTMLAttributes: { class: 'highlight' } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: '' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      DraggableImage,
      VoiceNoteExtension,
    ],
    content: note?.content || '',
    editorProps: {
      attributes: { class: 'tiptap-editor prose prose-sm min-h-[300px] outline-none max-w-none' },
      scrollThreshold: 0,
      scrollMargin: 0,
    },
    onTransaction: () => { forceUpdate(n => n + 1); },
  });

  const handleCreateInlineFolder = () => {
    if (inlineFolderName.trim()) {
      addFolder({ name: inlineFolderName.trim(), color: inlineFolderColor });
      setFolder(inlineFolderName.trim());
      setInlineFolderName('');
      setInlineFolderColor('sky');
      setMoreView('main');
      setMorePopoverOpen(false);
    }
  };

  // Block keyboard-open on checkbox tap (iOS + Android).
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom as HTMLElement;

    // iOS focuses contenteditable at the UIKit level before JS touchstart fires,
    // so preventDefault alone can't stop it. Instead we intercept focusin on
    // document (fires synchronously before the keyboard animation begins) and
    // immediately blur — the keyboard never appears.
    let suppressFocus = false;

    const onDocFocusIn = (e: FocusEvent) => {
      if (!suppressFocus) return;
      const t = e.target as Node;
      if (t === dom || dom.contains(t)) {
        dom.blur();
      }
    };

    const isCheckboxTarget = (e: Event): Element | null => {
      const target = e.target as HTMLElement;
      const li = target.closest('li[data-type="taskItem"]');
      if (!li) return null;
      const label = li.querySelector('label');
      if (!label || !label.contains(target)) return null;
      return li;
    };

    const toggleTaskItem = (li: Element) => {
      try {
        const pos = editor.view.posAtDOM(li, 0);
        const $pos = editor.state.doc.resolve(pos);
        for (let d = $pos.depth; d >= 0; d--) {
          if ($pos.node(d).type.name === 'taskItem') {
            const nodePos = $pos.before(d);
            const node = $pos.node(d);
            editor.view.dispatch(
              editor.state.tr.setNodeMarkup(nodePos, undefined, {
                ...node.attrs,
                checked: !node.attrs.checked,
              })
            );
            return;
          }
        }
      } catch { /* posAtDOM can throw */ }
    };

    const handleCheckboxTap = (e: Event) => {
      const li = isCheckboxTarget(e);
      if (!li) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      suppressFocus = true;
      toggleTaskItem(li);
      dom.blur();
      setTimeout(() => { suppressFocus = false; }, 500);
    };

    const blockEvent = (e: Event) => {
      const li = isCheckboxTarget(e);
      if (!li) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    };

    document.addEventListener('focusin', onDocFocusIn, true);
    dom.addEventListener('touchstart', handleCheckboxTap, { capture: true, passive: false });
    dom.addEventListener('touchend', blockEvent, { capture: true, passive: false });
    dom.addEventListener('click', blockEvent, { capture: true });
    dom.addEventListener('mousedown', handleCheckboxTap, true);
    return () => {
      document.removeEventListener('focusin', onDocFocusIn, true);
      dom.removeEventListener('touchstart', handleCheckboxTap, true);
      dom.removeEventListener('touchend', blockEvent, true);
      dom.removeEventListener('click', blockEvent, true);
      dom.removeEventListener('mousedown', handleCheckboxTap, true);
    };
  }, [editor]);

  const handleSave = () => {
    const noteData = {
      title: title.trim() || 'Untitled',
      content: editor?.getHTML() || '',
      type: note?.type || 'note' as const,
      folder,
      color: undefined,
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
    if (note) deleteWithUndo('note', note);
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
      editor?.chain().focus().setHighlight({ color: colorHslMap[highlightColor] }).run();
      setActiveHighlightColor(null);
    } else {
      setActiveHighlightColor(highlightColor);
    }
    setShowHighlightPicker(false);
  };

  const handleRemoveHighlight = () => {
    editor?.chain().focus().unsetHighlight().run();
    setActiveHighlightColor(null);
    setShowHighlightPicker(false);
  };

  useEffect(() => {
    if (!activeHighlightColor) setRemoveHighlightMode(false);
  }, [activeHighlightColor]);

  useEffect(() => {
    if (!editor || !activeHighlightColor) return;
    const handler = ({ editor: e }: { editor: typeof editor }) => {
      if (e && !e.state.selection.empty) {
        if (removeHighlightMode) {
          e.chain().unsetHighlight().run();
        } else {
          e.chain().setHighlight({ color: colorHslMap[activeHighlightColor] }).run();
        }
      }
    };
    editor.on('selectionUpdate', handler as any);
    return () => { editor.off('selectionUpdate', handler as any); };
  }, [editor, activeHighlightColor, removeHighlightMode]);

  const cycleAlignment = () => {
    const next = textAlign === 'left' ? 'center' : textAlign === 'center' ? 'right' : 'left';
    setTextAlign(next);
    editor?.chain().focus().setTextAlign(next).run();
  };

  const getAlignmentIcon = () => {
    if (textAlign === 'center') return AlignCenter;
    if (textAlign === 'right') return AlignRight;
    return AlignLeft;
  };
  const AlignIcon = getAlignmentIcon();

  const handleAddImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const compressedBase64 = await compressImage(file);
          if (compressedBase64.length > 500 * 1024) toast.warning('Image is large and may affect performance');
          editor?.chain().focus().insertContent({ type: 'image', attrs: { src: compressedBase64 } }).run();
        } catch {
          toast.error('Could not add image');
        }
      }
    };
    input.click();
  };

  const handleVoiceRecordingComplete = (audioData: string, duration: number) => {
    if (editor) insertVoiceNote(editor, audioData, duration);
  };

  const folderObj = folders.find(f => f.name === folder);

  const toggleStyle = (active: boolean) => cn(
    'w-9 h-5 rounded-full transition-all duration-200 flex items-center px-0.5',
    active ? 'bg-primary/20 border border-primary/40 justify-end' : 'bg-secondary/50 border border-border justify-start'
  );
  const toggleKnob = (active: boolean) => cn(
    'w-4 h-4 rounded-full transition-all duration-200 shadow-sm',
    active ? 'bg-primary' : 'bg-muted-foreground/30'
  );

  return (
    <div
      className="fixed left-0 right-0 z-[1100] bg-[#F8F7F4] dark:bg-background flex flex-col animate-fade-in"
      style={{ top: `${viewportOffset}px`, height: `${viewportHeight}px` }}
    >

      {/* Top bar — three floating elements */}
      <div
        className="fixed left-0 right-0 z-[1250] flex items-center"
        style={{ top: `calc(env(safe-area-inset-top, 0px) + ${viewportOffset + 12}px)`, pointerEvents: 'none' }}
      >

          {/* Back arrow — round button, far left */}
          <button
            onClick={handleSave}
            style={{ pointerEvents: 'auto' }}
            className="ml-4 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-foreground active:scale-95 transition-all shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          {/* Undo — round button */}
          <button
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={!editor?.can().undo()}
            onMouseDown={(e) => e.preventDefault()}
            style={{ pointerEvents: 'auto' }}
            className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-muted-foreground active:scale-95 transition-all disabled:opacity-30 shrink-0"
          >
            <Undo2 className="w-5 h-5" />
          </button>

          {/* + and ··· grouped pill — far right */}
          <div className="flex items-center bg-white rounded-full shadow-md h-10 px-2 ml-3 mr-4 shrink-0" style={{ pointerEvents: 'auto' }}>
          {/* + insert dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:bg-black/5 active:scale-95 transition-all">
                <Plus className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px] z-[1300]">
              <DropdownMenuItem onClick={() => editor?.chain().focus().toggleBulletList().run()} className={cn(editor?.isActive('bulletList') && 'bg-secondary')}>
                <List className="w-4 h-4 mr-2" />
                Bullet list
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={cn(editor?.isActive('orderedList') && 'bg-secondary')}>
                <ListOrdered className="w-4 h-4 mr-2" />
                Numbered list
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor?.chain().focus().toggleTaskList().run()} className={cn(editor?.isActive('taskList') && 'bg-secondary')}>
                <CheckSquare className="w-4 h-4 mr-2" />
                Checklist
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleAddImage}>
                <ImageIcon className="w-4 h-4 mr-2" />
                Image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowVoiceRecorder(true)}>
                <Mic className="w-4 h-4 mr-2" />
                Voice note
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowHighlightPicker(true)}>
                <Highlighter className="w-4 h-4 mr-2" />
                Highlight
                {activeHighlightColor && (
                  <span className="ml-auto w-3 h-3 rounded-full" style={{ background: colorHslMap[activeHighlightColor] }} />
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-5 bg-border mx-1" />
          {/* ··· more popover */}
          <Popover
            open={morePopoverOpen}
            onOpenChange={(open) => {
              setMorePopoverOpen(open);
              if (!open) {
                setMoreView('main');
                setInlineFolderName('');
                setInlineFolderColor('sky');
              }
            }}
          >
            <PopoverTrigger asChild>
              <button className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:bg-black/5 active:scale-95 transition-all">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="end"
              className="w-64 p-2 z-[1300]"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >

              {/* Main view */}
              {moreView === 'main' && (
                <div>
                  {/* Format section */}
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-1 pb-1">Format</p>
                  <div className="flex items-center gap-1 px-1 pb-1">
                    <button
                      onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                      className={cn('flex-1 py-1.5 rounded-lg text-xs font-bold text-center transition-colors', editor?.isActive('heading', { level: 1 }) ? 'bg-primary/15 text-primary' : 'hover:bg-secondary text-foreground')}
                    >H1</button>
                    <button
                      onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={cn('flex-1 py-1.5 rounded-lg text-xs font-semibold text-center transition-colors', editor?.isActive('heading', { level: 2 }) ? 'bg-primary/15 text-primary' : 'hover:bg-secondary text-foreground')}
                    >H2</button>
                    <button
                      onClick={() => editor?.chain().focus().setParagraph().run()}
                      className={cn('flex-1 py-1.5 rounded-lg text-xs text-center transition-colors', (editor?.isActive('paragraph') && !editor?.isActive('heading')) ? 'bg-primary/15 text-primary' : 'hover:bg-secondary text-muted-foreground')}
                    >Aa</button>
                  </div>
                  <div className="flex items-center gap-1 px-1 pb-1">
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      className={cn('flex-1 py-1.5 rounded-lg text-sm font-bold text-center transition-colors', editor?.isActive('bold') ? 'bg-primary/15 text-primary' : 'hover:bg-secondary text-foreground')}
                    >B</button>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => editor?.chain().focus().toggleItalic().run()}
                      className={cn('flex-1 py-1.5 rounded-lg text-sm italic text-center transition-colors', editor?.isActive('italic') ? 'bg-primary/15 text-primary' : 'hover:bg-secondary text-foreground')}
                    >I</button>
                    <button
                      onClick={cycleAlignment}
                      className="flex-1 py-1.5 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
                    >
                      <AlignIcon className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="h-px bg-border my-1" />

                  {/* Note section */}
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-0.5 pb-1">Note</p>
                  <button
                    onClick={handleTogglePin}
                    className={cn('w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors hover:bg-secondary', isPinned && 'text-primary')}
                  >
                    <Pin className="w-4 h-4 shrink-0" />
                    <span>{isPinned ? 'Unpin' : 'Pin'}</span>
                    {isPinned && <Check className="w-4 h-4 ml-auto" />}
                  </button>
                  <button
                    onClick={() => setMoreView('folder')}
                    className={cn('w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors hover:bg-secondary', folder && 'text-primary')}
                  >
                    <Folder className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left truncate">{folder || 'Folder'}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>

                  <div className="h-px bg-border my-1" />

                  {/* Options section */}
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-0.5 pb-1">Options</p>

                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-sm text-foreground">Date</span>
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <button className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary text-xs">
                          <Calendar className="w-3.5 h-3.5" />
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

                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-sm text-foreground">Show in calendar</span>
                    <button
                      onClick={() => {
                        const v = !showInCalendar;
                        setShowInCalendar(v);
                        if (!v) { setTime(undefined); setEndTime(undefined); }
                      }}
                      className={toggleStyle(showInCalendar)}
                    >
                      <span className={toggleKnob(showInCalendar)} />
                    </button>
                  </div>

                  {showInCalendar && (
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <span className="text-sm text-foreground">Time</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="time"
                          value={time || ''}
                          onChange={(e) => {
                            const val = e.target.value || undefined;
                            setTime(val);
                            if (!endTimeManuallySet.current && val) setEndTime(calculateEndTime(val));
                          }}
                          className="bg-secondary rounded-lg px-2 py-1 text-xs border-0 outline-none text-foreground"
                        />
                        {time && (
                          <button onClick={() => { setTime(undefined); setEndTime(undefined); }} className="p-1 rounded-lg hover:bg-secondary">
                            <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {showInCalendar && time && (
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <span className="text-sm text-foreground">End time</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="time"
                          value={endTime || ''}
                          onChange={(e) => { endTimeManuallySet.current = true; setEndTime(e.target.value || undefined); }}
                          min={time}
                          className="bg-secondary rounded-lg px-2 py-1 text-xs border-0 outline-none text-foreground"
                        />
                        {endTime && (
                          <button onClick={() => { endTimeManuallySet.current = false; setEndTime(undefined); }} className="p-1 rounded-lg hover:bg-secondary">
                            <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className={cn('px-2 py-1.5', !folder && 'opacity-40')}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Hide from All Notes</span>
                      <button
                        onClick={() => folder && setHideFromAllNotes(!hideFromAllNotes)}
                        className={cn(toggleStyle(hideFromAllNotes), !folder && 'cursor-not-allowed')}
                      >
                        <span className={toggleKnob(hideFromAllNotes)} />
                      </button>
                    </div>
                    {!folder && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">Requires a folder</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-sm text-foreground">Hide Date</span>
                    <button onClick={() => setHideDate(!hideDate)} className={toggleStyle(hideDate)}>
                      <span className={toggleKnob(hideDate)} />
                    </button>
                  </div>

                  {note && (
                    <>
                      <div className="h-px bg-border my-1" />
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                        Delete note
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Folder list view */}
              {moreView === 'folder' && (
                <div>
                  <div className="flex items-center gap-2 px-1 py-1 mb-1">
                    <button onClick={() => setMoreView('main')} className="p-1 rounded-lg hover:bg-secondary transition-colors">
                      <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <span className="text-sm font-medium">Folder</span>
                  </div>
                  {folder && (
                    <>
                      <button
                        onClick={() => { setFolder(undefined); setMoreView('main'); setMorePopoverOpen(false); }}
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
                      onClick={() => { setFolder(f.name); setMoreView('main'); setMorePopoverOpen(false); }}
                      className={cn('w-full text-left flex items-center px-2 py-1.5 text-sm rounded-md hover:bg-secondary', folder === f.name && 'bg-secondary')}
                    >
                      <div className={cn('w-2.5 h-2.5 rounded-full mr-2 shrink-0', `bg-pastel-${f.color}`)} />
                      <span>{f.name}</span>
                      {folder === f.name && <Check className="w-4 h-4 ml-auto" />}
                    </button>
                  ))}
                  {folders.length > 0 && <div className="h-px bg-border my-1" />}
                  <button
                    onClick={() => setMoreView('folder-create')}
                    className="w-full text-left flex items-center px-2 py-1.5 text-sm text-muted-foreground hover:bg-secondary rounded-md"
                  >
                    <FolderPlus className="w-4 h-4 mr-2" />
                    New folder
                  </button>
                </div>
              )}

              {/* Folder create view */}
              {moreView === 'folder-create' && (
                <div className="p-1 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => setMoreView('folder')} className="p-1 rounded-lg hover:bg-secondary transition-colors">
                      <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Folder</p>
                  </div>
                  <input
                    type="text"
                    value={inlineFolderName}
                    onChange={(e) => setInlineFolderName(e.target.value)}
                    placeholder="Folder name"
                    className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm border-0 outline-none text-foreground placeholder:text-muted-foreground"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateInlineFolder();
                      if (e.key === 'Escape') setMoreView('folder');
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {pastelColors.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setInlineFolderColor(c.value)}
                        className={cn('w-6 h-6 rounded-full transition-all', c.class, inlineFolderColor === c.value && 'ring-2 ring-offset-2 ring-primary')}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMoreView('folder')}
                      className="flex-1 py-2 rounded-xl bg-secondary text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >Cancel</button>
                    <button
                      type="button"
                      onClick={handleCreateInlineFolder}
                      className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >Create</button>
                  </div>
                </div>
              )}

            </PopoverContent>
          </Popover>
          </div>{/* end + ··· pill */}
      </div>{/* end top bar */}

      {/* Floating highlight mode circle */}
      {activeHighlightColor && (
        <div
          className="fixed z-[1200]"
          style={{ top: `calc(env(safe-area-inset-top, 0px) + ${viewportOffset + 64}px)`, right: '16px' }}
        >
          <div className="relative">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setRemoveHighlightMode(m => !m)}
              className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center active:scale-95 transition-all"
            >
              <div className="relative">
                <Highlighter className="w-5 h-5" style={{ color: colorHslMap[activeHighlightColor] }} />
                {removeHighlightMode && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="absolute w-[130%] h-0.5 bg-foreground/70 rotate-[-40deg]" />
                  </div>
                )}
              </div>
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setActiveHighlightColor(null); setRemoveHighlightMode(false); }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-foreground/75 text-background flex items-center justify-center shadow-sm active:scale-90 transition-all"
            >
              <span className="text-[11px] font-bold leading-none">×</span>
            </button>
          </div>
        </div>
      )}

      {/* Highlight color picker */}
      {showHighlightPicker && (
        <>
          <div className="fixed inset-0 z-[1260]" onClick={() => setShowHighlightPicker(false)} />
          <div className="fixed left-1/2 -translate-x-1/2 w-[calc(100%-32px)] z-[1300] top-[120px]">
            <div className="bg-background rounded-2xl shadow-lg p-3 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Highlighter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Highlight</span>
                {activeHighlightColor && <span className="text-xs text-primary ml-auto">Pen mode active</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {pastelColors.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => handleHighlight(c.value)}
                    className={cn('w-8 h-8 rounded-full transition-all', activeHighlightColor === c.value && 'ring-2 ring-offset-2 ring-primary')}
                    style={{ background: colorHslMap[c.value] }}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Scrollable content — left-aligned */}
      <div
        className="flex-1 px-5"
        style={{
          paddingTop: '120px',
          paddingBottom: '100px',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        {/* Date + folder on same line */}
        {(!hideDate || folder) && (
          <div className="flex items-center gap-2 mb-3">
            {!hideDate && (
              <span className="text-xs text-muted-foreground">
                {format(date, 'MMMM d, yyyy')}
              </span>
            )}
            {folder && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary">
                {folderObj && <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', `bg-pastel-${folderObj.color}`)} />}
                <span className="text-xs font-medium text-muted-foreground">{folder}</span>
              </div>
            )}
          </div>
        )}

        {/* TipTap editor */}
        <EditorContent editor={editor} className="tiptap-content" />
      </div>

      <VoiceRecordingModal
        isOpen={showVoiceRecorder}
        onClose={() => setShowVoiceRecorder(false)}
        onRecordingComplete={handleVoiceRecordingComplete}
      />

    </div>
  );
}
