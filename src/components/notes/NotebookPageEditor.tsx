import { useState, useEffect, useRef, useCallback } from 'react';
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
  Palette,
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
import { NotebookPage, NoteType, PastelColor, Notebook } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useUndoableDelete } from '@/hooks/useUndoableDelete';
import { useAutoSave } from '@/hooks/useAutoSave';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { pastelColors, getColorVar } from '@/lib/colors';
import { compressImage } from '@/lib/mediaUtils';
import { VoiceRecordingModal } from './VoiceRecordingModal';
import { VoiceNoteExtension, insertVoiceNote } from './VoiceNoteExtension';

interface NotebookPageEditorProps {
  notebook: Notebook;
  page?: NotebookPage;
  onClose: () => void;
}


export function NotebookPageEditor({ notebook, page, onClose }: NotebookPageEditorProps) {
  const { addNotebookPage, updateNotebookPage, notebookPages } = useAppStore();
  const { deleteWithUndo } = useUndoableDelete();

  const [title, setTitle] = useState(page?.title || '');
  const [date, setDate] = useState<Date>(page?.date ? new Date(page.date) : new Date());
  const [time, setTime] = useState<string | undefined>(page?.time);
  const [endTime, setEndTime] = useState<string | undefined>(page?.endTime);
  const endTimeManuallySet = useRef(false);
  const [showInCalendar, setShowInCalendar] = useState(page?.showInCalendar || false);
  const [hideDate, setHideDate] = useState(page?.hideDate || false);
  const [selectedColor, setSelectedColor] = useState<PastelColor | undefined>(page?.color);

  const calculateEndTime = (start: string): string => {
    const [h, m] = start.split(':').map(Number);
    const endH = Math.min(h + 1, 23);
    const endMin = h + 1 > 23 ? 59 : m;
    return `${String(endH).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (showInCalendar && time && !endTime && !endTimeManuallySet.current) {
      setEndTime(calculateEndTime(time));
    }
  }, [showInCalendar, time, endTime]);

  const [morePopoverOpen, setMorePopoverOpen] = useState(false);
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
      Placeholder.configure({ placeholder: 'Start writing...' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      DraggableImage,
      VoiceNoteExtension,
    ],
    content: page?.content || '',
    editorProps: {
      attributes: { class: 'tiptap-editor prose prose-sm min-h-[300px] outline-none max-w-none' },
      scrollThreshold: 0,
      scrollMargin: 0,
    },
    onTransaction: () => { forceUpdate(n => n + 1); },
  });

  const autoSaveFn = useCallback(() => {
    if (!page) return;
    updateNotebookPage(page.id, {
      title,
      content: editor?.getHTML() || '',
      showInCalendar,
      hideDate,
      color: selectedColor,
      date,
      time: showInCalendar ? time : undefined,
      endTime: showInCalendar && time ? endTime : undefined,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, title, editor, showInCalendar, hideDate, selectedColor, date, time, endTime]);

  const { trigger: triggerAutoSave, cancel: cancelAutoSave } = useAutoSave(autoSaveFn);

  // Trigger auto-save when TipTap content changes
  useEffect(() => {
    if (!editor || !page) return;
    const handler = () => triggerAutoSave();
    editor.on('update', handler);
    return () => { editor.off('update', handler); };
  }, [editor, page, triggerAutoSave]);

  // Trigger auto-save when metadata changes (skip on initial mount)
  const settingsMounted = useRef(false);
  useEffect(() => {
    if (!settingsMounted.current) { settingsMounted.current = true; return; }
    if (!page) return;
    triggerAutoSave();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, showInCalendar, hideDate, selectedColor, date, time, endTime]);

  // Prevent iOS keyboard from opening when tapping a task-list checkbox
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom as HTMLElement;

    let suppressFocus = false;

    const onDocFocusIn = (e: FocusEvent) => {
      if (!suppressFocus) return;
      const t = e.target as Node;
      if (t === dom || dom.contains(t)) dom.blur();
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
              editor.state.tr.setNodeMarkup(nodePos, undefined, { ...node.attrs, checked: !node.attrs.checked })
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
    cancelAutoSave();
    const content = editor?.getHTML() || '';
    const pagesInNotebook = notebookPages.filter(p => p.notebookId === notebook.id);
    if (page) {
      updateNotebookPage(page.id, {
        title,
        content,
        showInCalendar,
        hideDate,
        color: selectedColor,
        date,
        time: showInCalendar ? time : undefined,
        endTime: showInCalendar && time ? endTime : undefined,
      });
    } else {
      addNotebookPage({
        notebookId: notebook.id,
        title,
        content,
        type: 'note' as NoteType,
        order: pagesInNotebook.length,
        showInCalendar,
        hideDate,
        color: selectedColor,
        date,
        time: showInCalendar ? time : undefined,
        endTime: showInCalendar && time ? endTime : undefined,
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (page) deleteWithUndo('notebookPage', page);
    onClose();
  };

  const handleHighlight = (highlightColor: PastelColor) => {
    const hasSelection = editor && !editor.state.selection.empty;
    if (hasSelection) {
      editor?.chain().focus().setHighlight({ color: getColorVar(highlightColor) }).run();
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
          e.chain().setHighlight({ color: activeHighlightColor ? getColorVar(activeHighlightColor) : undefined }).run();
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
                  <span className="ml-auto w-3 h-3 rounded-full" style={{ background: activeHighlightColor ? getColorVar(activeHighlightColor) : undefined }} />
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
              if (!open) setDatePickerOpen(false);
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

                {/* Options section */}
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-0.5 pb-1">Options</p>

                {/* Page color */}
                <div className="px-2 py-1.5">
                  <div className="flex items-center gap-2 mb-2">
                    <Palette className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Page color</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setSelectedColor(undefined)}
                      className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all', !selectedColor ? 'border-foreground scale-110' : 'border-border')}
                      style={{ background: 'white' }}
                    >
                      {!selectedColor && <Check className="w-3 h-3 text-foreground" />}
                    </button>
                    {pastelColors.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setSelectedColor(c.value)}
                        className={cn('w-6 h-6 rounded-full transition-all', c.class, selectedColor === c.value ? 'ring-2 ring-offset-1 ring-primary scale-110' : '')}
                      />
                    ))}
                  </div>
                </div>

                {/* Date */}
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

                {/* Show in calendar */}
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

                {/* Hide Date */}
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="text-sm text-foreground">Hide Date</span>
                  <button onClick={() => setHideDate(!hideDate)} className={toggleStyle(hideDate)}>
                    <span className={toggleKnob(hideDate)} />
                  </button>
                </div>

                {page && (
                  <>
                    <div className="h-px bg-border my-1" />
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
                      Delete page
                    </button>
                  </>
                )}
              </div>
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
                <Highlighter className="w-5 h-5" style={{ color: activeHighlightColor ? getColorVar(activeHighlightColor) : undefined }} />
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
                    className={cn('w-8 h-8 rounded-full transition-all', c.class, activeHighlightColor === c.value && 'ring-2 ring-offset-2 ring-primary')}
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

      {/* Scrollable content */}
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
        {!hideDate && (
          <div className="mb-1">
            <span className="text-xs text-muted-foreground">
              {format(date, 'MMMM d, yyyy')}
            </span>
          </div>
        )}

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
