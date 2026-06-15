import { useState, useMemo, useRef, useEffect } from 'react';
import { isToday } from 'date-fns';
import { ArrowLeft, MoreHorizontal, Plus, ChevronDown, ChevronRight, Pin, PinOff, Pencil, Trash2, Star, Calendar as CalendarIcon, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskCategory, Task } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { TaskCell } from './TaskCell';
import { SortableTaskCell } from './SortableTaskCell';
import { InlineNewTaskRow } from './InlineNewTaskRow';
import { SectionHeader } from './SectionHeader';
import { AddTaskModal } from './AddTaskModal';
import { CreateListModal } from './CreateListModal';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';

interface ListDetailViewProps {
  category: TaskCategory;
  tasks: Task[];
  onBack: () => void;
  highlightTaskId?: string;
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function ListDetailView({ category, tasks, onBack, highlightTaskId }: ListDetailViewProps) {
  const {
    addTask,
    updateTask,
    deleteTask,
    addEvent,
    eventCategories,
    updateTaskCategory,
    deleteTaskCategory,
    pinTaskCategory,
    unpinTaskCategory,
    taskSections,
    taskCategories,
    addTaskSection,
    deleteTaskSection,
    updateTaskSection,
    reorderTasks,
    reorderTaskSections,
  } = useAppStore();

  const isVirtualList = category.id.startsWith('__');
  // Smart lists use local state (default true) since virtual categories don't persist
  const [smartShowCompleted, setSmartShowCompleted] = useState(true);
  const showCompleted = isVirtualList ? smartShowCompleted : (category.showCompleted ?? false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [adding, setAdding] = useState<string | null>(null); // sectionId or 'main' or 'new-section'
  const [newSectionName, setNewSectionName] = useState('');
  const [completedExpanded, setCompletedExpanded] = useState<Set<string>>(new Set());
  const toggleCompleted = (id: string) =>
    setCompletedExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const [showMenu, setShowMenu] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingList, setEditingList] = useState(false);
  const [sectionMenuId, setSectionMenuId] = useState<string | null>(null);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [renamingSectionId, setRenamingSectionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const sectionMenuRef = useRef<HTMLDivElement | null>(null);
  const sectionMenuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const mainMenuRef = useRef<HTMLDivElement | null>(null);
  const mainMenuTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!showMenu) return;

    const isInside = (target: Node | null) =>
      !!target &&
      (menuRef.current?.contains(target) ||
        menuTriggerRef.current?.contains(target));

    const swallow = (e: Event) => {
      const target = e.target as Node | null;
      if (isInside(target)) return;
      e.preventDefault();
      e.stopPropagation();
      (e as any).stopImmediatePropagation?.();
      if (e.type === 'pointerdown' || e.type === 'mousedown' || e.type === 'touchstart') {
        setTimeout(() => setShowMenu(false), 0);
      }
    };

    document.addEventListener('pointerdown', swallow, true);
    document.addEventListener('mousedown', swallow, true);
    document.addEventListener('touchstart', swallow, true);
    document.addEventListener('click', swallow, true);

    return () => {
      document.removeEventListener('pointerdown', swallow, true);
      document.removeEventListener('mousedown', swallow, true);
      document.removeEventListener('touchstart', swallow, true);
      document.removeEventListener('click', swallow, true);
    };
  }, [showMenu]);

  useEffect(() => {
    if (!sectionMenuId) return;

    const isInside = (target: Node | null) =>
      !!target &&
      (sectionMenuRef.current?.contains(target) ||
        sectionMenuTriggerRef.current?.contains(target));

    const swallow = (e: Event) => {
      const target = e.target as Node | null;
      if (isInside(target)) return;
      e.preventDefault();
      e.stopPropagation();
      (e as any).stopImmediatePropagation?.();
      if (e.type === 'pointerdown' || e.type === 'mousedown' || e.type === 'touchstart') {
        setTimeout(() => setSectionMenuId(null), 0);
      }
    };

    document.addEventListener('pointerdown', swallow, true);
    document.addEventListener('mousedown', swallow, true);
    document.addEventListener('touchstart', swallow, true);
    document.addEventListener('click', swallow, true);

    return () => {
      document.removeEventListener('pointerdown', swallow, true);
      document.removeEventListener('mousedown', swallow, true);
      document.removeEventListener('touchstart', swallow, true);
      document.removeEventListener('click', swallow, true);
    };
  }, [sectionMenuId]);

  useEffect(() => {
    if (!showMainMenu) return;

    const isInside = (target: Node | null) =>
      !!target &&
      (mainMenuRef.current?.contains(target) ||
        mainMenuTriggerRef.current?.contains(target));

    const swallow = (e: Event) => {
      const target = e.target as Node | null;
      if (isInside(target)) return;
      e.preventDefault();
      e.stopPropagation();
      (e as any).stopImmediatePropagation?.();
      if (e.type === 'pointerdown' || e.type === 'mousedown' || e.type === 'touchstart') {
        setTimeout(() => setShowMainMenu(false), 0);
      }
    };

    document.addEventListener('pointerdown', swallow, true);
    document.addEventListener('mousedown', swallow, true);
    document.addEventListener('touchstart', swallow, true);
    document.addEventListener('click', swallow, true);

    return () => {
      document.removeEventListener('pointerdown', swallow, true);
      document.removeEventListener('mousedown', swallow, true);
      document.removeEventListener('touchstart', swallow, true);
      document.removeEventListener('click', swallow, true);
    };
  }, [showMainMenu]);

  const commitRename = () => {
    if (!renamingSectionId) return;
    const t = renameValue.trim();
    if (t) updateTaskSection(renamingSectionId, { name: t });
    setRenamingSectionId(null);
    setRenameValue('');
  };

  const sections = useMemo(
    () => taskSections.filter((s) => s.listId === category.id).sort((a, b) => a.order - b.order),
    [taskSections, category.id],
  );

  const incomplete = tasks.filter((t) => !t.completed);
  const allCompleted = tasks.filter((t) => t.completed);
  // Smart lists only show tasks completed today (they disappear at midnight)
  const completed = isVirtualList
    ? allCompleted.filter((t) => t.completedAt && isToday(t.completedAt))
    : allCompleted;
  const mainTasks = sortTasks(isVirtualList ? incomplete : incomplete.filter((t) => !t.sectionId));
  const mainCompleted = sortTasks(isVirtualList ? completed : completed.filter((t) => !t.sectionId));

  const handleCreate = (title: string, sectionId?: string) => {
    // Virtual list IDs (e.g. '__priority') are not real UUIDs — resolve to a real list
    const targetList = isVirtualList
      ? (taskCategories.find((c) => c.isDefault) ?? taskCategories.find((c) => !c.isDefault))
      : category;
    addTask({
      title,
      completed: false,
      category: targetList?.name ?? '',
      color: targetList?.color ?? 'stone',
      subtasks: [],
      priority: category.id === '__priority' ? 'medium' : 'none',
      date: category.id === '__today' ? new Date() : undefined,
      sectionId,
      listId: targetList?.id,
      // Seconds-since-epoch fits in int4; large enough to keep insertion order monotonic
      order: Math.floor(Date.now() / 1000),
    });
  };

  // When clearing completed tasks, convert tasks with a date to standalone calendar
  // events so the calendar entry persists, then delete the task record.
  const clearCompleted = (tasksToClear: Task[]) => {
    tasksToClear.forEach((t) => {
      if (t.date) {
        addEvent({
          title: t.title,
          date: new Date(t.date),
          startTime: t.time,
          endTime: t.endTime,
          category: eventCategories[0]?.name ?? '',
          color: t.color,
          isAllDay: !t.time,
        });
      }
      deleteTask(t.id);
    });
  };

  // All visible (non-collapsed) task IDs for the single shared DndContext
  const allVisibleTaskIds = useMemo(() => [
    ...mainTasks.map(t => t.id),
    ...(showCompleted ? mainCompleted.map(t => t.id) : []),
    ...sections.flatMap(s => {
      if (s.collapsed) return [];
      const ids = sortTasks(incomplete.filter(t => t.sectionId === s.id)).map(t => t.id);
      if (showCompleted) ids.push(...sortTasks(completed.filter(t => t.sectionId === s.id)).map(t => t.id));
      return ids;
    }),
  ], [mainTasks, mainCompleted, sections, incomplete, completed, showCompleted]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const getGroup = (taskId: string): string | undefined =>
      incomplete.find(t => t.id === taskId)?.sectionId;

    const activeGroup = getGroup(activeId);
    const overGroup = getGroup(overId);

    if (activeGroup === overGroup) {
      // Same section — reorder within group
      const groupTasks = activeGroup == null
        ? mainTasks
        : sortTasks(incomplete.filter(t => t.sectionId === activeGroup));
      const ids = groupTasks.map(t => t.id);
      const oldIndex = ids.indexOf(activeId);
      const newIndex = ids.indexOf(overId);
      if (oldIndex >= 0 && newIndex >= 0) reorderTasks(arrayMove(ids, oldIndex, newIndex));
    } else {
      // Cross-section drop: move task to new group and reorder
      updateTask(activeId, { sectionId: overGroup });
      const targetTasks = (overGroup == null
        ? mainTasks
        : sortTasks(incomplete.filter(t => t.sectionId === overGroup))
      ).filter(t => t.id !== activeId);
      const overIndex = targetTasks.findIndex(t => t.id === overId);
      const newIds = [...targetTasks.map(t => t.id)];
      newIds.splice(overIndex >= 0 ? overIndex : newIds.length, 0, activeId);
      reorderTasks(newIds);
    }
  };

  const moveSectionUp = (id: string) => {
    const idx = sections.findIndex((s) => s.id === id);
    if (idx <= 0) return;
    const ids = sections.map((s) => s.id);
    [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
    reorderTaskSections(ids);
    setSectionMenuId(null);
  };

  const moveSectionDown = (id: string) => {
    const idx = sections.findIndex((s) => s.id === id);
    if (idx < 0 || idx >= sections.length - 1) return;
    const ids = sections.map((s) => s.id);
    [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
    reorderTaskSections(ids);
    setSectionMenuId(null);
  };

  const addSectionAction = () => {
    const t = newSectionName.trim();
    if (!t) {
      setAdding(null);
      return;
    }
    addTaskSection({
      listId: category.id,
      name: t,
      order: sections.length,
    });
    setNewSectionName('');
    setAdding(null);
  };

  return (
    <div className="min-h-screen pb-32 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pt-safe-2">
        <div className="flex items-center gap-2 px-4 pb-3">
          <button
            onClick={onBack}
            className="w-9 h-9 -ml-1 rounded-full hover:bg-secondary flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1" />
          <button
            ref={menuTriggerRef}
            onClick={() => setShowMenu((v) => !v)}
            className="w-9 h-9 rounded-full hover:bg-secondary flex items-center justify-center transition-colors relative"
          >
            <MoreHorizontal className="w-5 h-5 text-foreground" />
            {showMenu && (
              <div
                ref={menuRef}
                className="absolute top-full right-0 mt-1 bg-card rounded-2xl shadow-2xl border border-border/40 overflow-hidden w-52"
                style={{ zIndex: 50 }}
                onClick={(e) => e.stopPropagation()}
              >
                {!isVirtualList && (
                  <>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setEditingList(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary text-left"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" /> Edit list
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        if (category.pinned) unpinTaskCategory(category.id);
                        else pinTaskCategory(category.id);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary text-left"
                    >
                      {category.pinned ? (
                        <>
                          <PinOff className="w-4 h-4 text-muted-foreground" /> Unpin
                        </>
                      ) : (
                        <>
                          <Pin className="w-4 h-4 text-muted-foreground" /> Pin to top
                        </>
                      )}
                    </button>
                    <div className="h-px bg-border/40" />
                  </>
                )}
                <button
                  onClick={() => {
                    if (isVirtualList) setSmartShowCompleted((v) => !v);
                    else updateTaskCategory(category.id, { showCompleted: !showCompleted });
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-secondary text-left"
                >
                  <span>Show completed tasks</span>
                  <div className={cn(
                    'w-8 h-4.5 rounded-full transition-colors relative flex-shrink-0 border',
                    showCompleted ? 'bg-primary/20 border-primary/40' : 'bg-muted-foreground/20 border-border'
                  )}
                  style={{ width: '2rem', height: '1.125rem' }}
                  >
                    <div className={cn(
                      'absolute top-[1px] w-3.5 h-3.5 rounded-full shadow transition-transform',
                      showCompleted ? 'translate-x-3.5 bg-primary' : 'translate-x-0.5 bg-muted-foreground/40'
                    )} />
                  </div>
                </button>
                {!isVirtualList && !category.isDefault && (
                  <>
                    <div className="h-px bg-border/40" />
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        deleteTaskCategory(category.id);
                        onBack();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 text-left"
                    >
                      <Trash2 className="w-4 h-4" /> Delete list
                    </button>
                  </>
                )}
              </div>
            )}
          </button>
        </div>

        {/* Title */}
        <div className="px-5 pb-1 flex items-center gap-3">
          {category.id === '__priority' ? (
            <Star className="w-5 h-5 fill-smart-priority text-smart-priority" />
          ) : category.id === '__today' ? (
            <CalendarIcon className="w-5 h-5 text-smart-today" />
          ) : (
            <span className={cn('w-3.5 h-3.5 rounded-full', `bg-pastel-${category.color}`)} />
          )}
          <h1 className="flow-page-title">{category.name}</h1>
          <span className="ml-auto flow-meta tabular-nums">{incomplete.length}</span>
        </div>

      </div>

      {/* Content — single DndContext covers all sections for cross-section drag */}
      <div className="px-4 pt-2 space-y-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={allVisibleTaskIds}
            strategy={verticalListSortingStrategy}
          >
        {/* Clear completed ··· menu for unsectioned tasks (when showCompleted is on) */}
        {!isVirtualList && showCompleted && mainCompleted.length > 0 && (
          <div className="relative flex items-center px-1 pt-1 justify-end">
            <button
              ref={mainMenuTriggerRef}
              onClick={() => setShowMainMenu((v) => !v)}
              className="p-1 -mr-1 text-muted-foreground/60 hover:text-foreground rounded-md hover:bg-secondary transition-colors"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {showMainMenu && (
              <div
                ref={mainMenuRef}
                className="absolute right-0 top-full mt-1 bg-card rounded-2xl shadow-2xl border border-border/40 overflow-hidden w-44"
                style={{ zIndex: 50 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    clearCompleted(mainCompleted);
                    setShowMainMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary text-left"
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" /> Clear completed
                </button>
              </div>
            )}
          </div>
        )}

        {/* Main (no section) tasks */}
        <div className="space-y-2">
          {mainTasks.map((task) => (
            <SortableTaskCell
              key={task.id}
              task={task}
              onClick={() => setEditingTaskId(task.id)}
              highlight={task.id === highlightTaskId}
            />
          ))}
          {!isVirtualList && showCompleted && mainCompleted.map((task) => (
            <SortableTaskCell
              key={task.id}
              task={task}
              onClick={() => setEditingTaskId(task.id)}
              highlight={task.id === highlightTaskId}
            />
          ))}
        </div>

        {adding === 'main' && (
          <InlineNewTaskRow
            onSubmit={(t) => handleCreate(t)}
            onDismiss={() => setAdding(null)}
          />
        )}

        {/* Smart list: inline always-expanded completed section */}
        {isVirtualList && showCompleted && mainCompleted.length > 0 && (
          <div className="pt-3">
            <div className="flex items-center gap-2 px-1 pb-2">
              <span className="text-[13px] font-semibold tracking-tight text-muted-foreground">Completed</span>
              <span className="text-xs text-muted-foreground/60">{mainCompleted.length}</span>
            </div>
            <div className="space-y-2 opacity-70">
              {mainCompleted.map((t) => (
                <TaskCell key={t.id} task={t} onClick={() => setEditingTaskId(t.id)} />
              ))}
            </div>
          </div>
        )}

        {!isVirtualList && !showCompleted && mainCompleted.length > 0 && (
          <div className="pt-1">
            <div className="flex items-center justify-between">
              <button
                onClick={() => toggleCompleted('main')}
                className="flex items-center gap-2 px-1 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {completedExpanded.has('main') ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                Completed
                <span className="text-xs">{mainCompleted.length}</span>
              </button>
              <button
                onClick={() => clearCompleted(mainCompleted)}
                className="px-2 py-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear
              </button>
            </div>
            {completedExpanded.has('main') && (
              <div className="space-y-2 mt-1 opacity-70">
                {mainCompleted.map((t) => (
                  <TaskCell key={t.id} task={t} onClick={() => setEditingTaskId(t.id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sections */}
        {sections.map((section) => {
          const sTasks = sortTasks(incomplete.filter((t) => t.sectionId === section.id));
          const sCompleted = sortTasks(completed.filter((t) => t.sectionId === section.id));
          const collapsed = section.collapsed;
          return (
            <div key={section.id} className="pt-3">
              {renamingSectionId === section.id ? (
                <div className="flex items-center gap-2 px-1 pt-3 pb-1.5">
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') {
                        setRenamingSectionId(null);
                        setRenameValue('');
                      }
                    }}
                    className="flex-1 bg-secondary rounded-lg px-3 py-2 text-[16px] font-semibold tracking-tight outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              ) : (
                <div className="relative">
                  <SectionHeader
                    name={section.name}
                    count={sTasks.length}
                    collapsed={!!collapsed}
                    onToggle={() => updateTaskSection(section.id, { collapsed: !collapsed })}
                    onMenu={() => setSectionMenuId(sectionMenuId === section.id ? null : section.id)}
                    menuTriggerRef={sectionMenuId === section.id ? sectionMenuTriggerRef : undefined}
                  />
                  {sectionMenuId === section.id && (
                    <div
                      ref={sectionMenuRef}
                      className="absolute right-0 top-full mt-1 bg-card rounded-2xl shadow-2xl border border-border/40 overflow-hidden w-44"
                      style={{ zIndex: 50 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {sections.findIndex((s) => s.id === section.id) > 0 && (
                        <button
                          onClick={() => moveSectionUp(section.id)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary text-left"
                        >
                          <ChevronUp className="w-4 h-4 text-muted-foreground" /> Move up
                        </button>
                      )}
                      {sections.findIndex((s) => s.id === section.id) < sections.length - 1 && (
                        <button
                          onClick={() => moveSectionDown(section.id)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary text-left"
                        >
                          <ChevronDown className="w-4 h-4 text-muted-foreground" /> Move down
                        </button>
                      )}
                      {(sections.findIndex((s) => s.id === section.id) > 0 || sections.findIndex((s) => s.id === section.id) < sections.length - 1) && (
                        <div className="h-px bg-border/40" />
                      )}
                      <button
                        onClick={() => {
                          setRenameValue(section.name);
                          setRenamingSectionId(section.id);
                          setSectionMenuId(null);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary text-left"
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" /> Rename
                      </button>
                      {sCompleted.length > 0 && (
                        <>
                          <div className="h-px bg-border/40" />
                          <button
                            onClick={() => {
                              clearCompleted(sCompleted);
                              setSectionMenuId(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary text-left"
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground" /> Clear completed
                          </button>
                        </>
                      )}
                      <div className="h-px bg-border/40" />
                      <button
                        onClick={() => {
                          deleteTaskSection(section.id);
                          setSectionMenuId(null);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 text-left"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
              {!collapsed && (
                <div className="space-y-2 mt-1">
                  <div className="space-y-2">
                    {sTasks.map((task) => (
                      <SortableTaskCell
                        key={task.id}
                        task={task}
                        onClick={() => setEditingTaskId(task.id)}
                        highlight={task.id === highlightTaskId}
                      />
                    ))}
                    {showCompleted && sCompleted.map((task) => (
                      <SortableTaskCell
                        key={task.id}
                        task={task}
                        onClick={() => setEditingTaskId(task.id)}
                        highlight={task.id === highlightTaskId}
                      />
                    ))}
                  </div>
                  {adding === section.id && (
                    <InlineNewTaskRow
                      onSubmit={(t) => handleCreate(t, section.id)}
                      onDismiss={() => setAdding(null)}
                    />
                  )}
                  {adding !== section.id && (
                    <button
                      onClick={() => setAdding(section.id)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add task
                    </button>
                  )}
                  {!showCompleted && sCompleted.length > 0 && (
                    <div className="pt-1">
                      <button
                        onClick={() => toggleCompleted(section.id)}
                        className="flex items-center gap-2 px-1 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {completedExpanded.has(section.id) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        Completed
                        <span className="text-xs">{sCompleted.length}</span>
                      </button>
                      {completedExpanded.has(section.id) && (
                        <div className="space-y-2 mt-1 opacity-70">
                          {sCompleted.map((t) => (
                            <TaskCell key={t.id} task={t} onClick={() => setEditingTaskId(t.id)} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
          </SortableContext>
        </DndContext>

        {/* New section input */}
        {!isVirtualList && adding === 'new-section' && (
          <div className="flex items-center gap-2 pt-3 px-1">
            <input
              autoFocus
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              onBlur={addSectionAction}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addSectionAction();
                if (e.key === 'Escape') {
                  setNewSectionName('');
                  setAdding(null);
                }
              }}
              placeholder="Section name"
              className="flex-1 bg-secondary rounded-lg px-3 py-2 text-[15px] font-semibold tracking-tight outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="pt-4 flex items-center gap-2">
          {adding !== 'main' && (
            <button
              onClick={() => setAdding('main')}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-card rounded-2xl text-sm font-medium text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.06)] transition-all"
            >
              <Plus className="w-4 h-4" /> Add task
            </button>
          )}
          {!isVirtualList && (
            <button
              onClick={() => setAdding('new-section')}
              className="px-4 py-3 bg-card rounded-2xl text-sm font-medium text-muted-foreground shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:text-foreground transition-all"
            >
              + Section
            </button>
          )}
        </div>

        {tasks.length === 0 && adding === null && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">No tasks yet</p>
          </div>
        )}

      </div>

      {editingTaskId && (
        <AddTaskModal
          isOpen
          onClose={() => setEditingTaskId(null)}
          editingTaskId={editingTaskId}
        />
      )}
      {editingList && (
        <CreateListModal
          isOpen
          editingId={category.id}
          onClose={() => setEditingList(false)}
        />
      )}
    </div>
  );
}
