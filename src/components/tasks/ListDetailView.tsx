import { useState, useMemo } from 'react';
import { ArrowLeft, MoreHorizontal, Plus, ChevronDown, ChevronRight, Pin, PinOff, Pencil, Trash2, Check, Star, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskCategory, Task } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { TaskCell } from './TaskCell';
import { InlineNewTaskRow } from './InlineNewTaskRow';
import { SectionHeader } from './SectionHeader';
import { AddTaskModal } from './AddTaskModal';
import { CreateListModal } from './CreateListModal';

interface ListDetailViewProps {
  category: TaskCategory;
  tasks: Task[];
  onBack: () => void;
}

type SortMode = 'manual' | 'date' | 'created';

function sortTasks(tasks: Task[], mode: SortMode): Task[] {
  const arr = [...tasks];
  if (mode === 'date') {
    arr.sort((a, b) => {
      const ad = a.date ? new Date(a.date).getTime() : Infinity;
      const bd = b.date ? new Date(b.date).getTime() : Infinity;
      return ad - bd;
    });
  } else if (mode === 'created') {
    arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
  return arr;
}

export function ListDetailView({ category, tasks, onBack }: ListDetailViewProps) {
  const {
    addTask,
    updateTaskCategory,
    deleteTaskCategory,
    pinTaskCategory,
    unpinTaskCategory,
    taskSections,
    addTaskSection,
    deleteTaskSection,
    updateTaskSection,
  } = useAppStore();

  const sortMode: SortMode = category.sortMode ?? 'manual';

  const [adding, setAdding] = useState<string | null>(null); // sectionId or 'main' or 'new-section'
  const [newSectionName, setNewSectionName] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingList, setEditingList] = useState(false);

  const sections = useMemo(
    () => taskSections.filter((s) => s.listId === category.id).sort((a, b) => a.order - b.order),
    [taskSections, category.id],
  );

  const incomplete = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);
  const mainTasks = sortTasks(incomplete.filter((t) => !t.sectionId), sortMode);

  const handleCreate = (title: string, sectionId?: string) => {
    addTask({
      title,
      completed: false,
      category: category.name,
      color: category.color,
      subtasks: [],
      priority: 'none',
      sectionId,
    });
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
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            onClick={onBack}
            className="w-9 h-9 -ml-1 rounded-full hover:bg-secondary flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="w-9 h-9 rounded-full hover:bg-secondary flex items-center justify-center transition-colors relative"
          >
            <MoreHorizontal className="w-5 h-5 text-foreground" />
            {showMenu && (
              <div
                className="absolute top-full right-0 mt-1 bg-card rounded-2xl shadow-2xl border border-border/40 overflow-hidden w-52"
                style={{ zIndex: 50 }}
                onClick={(e) => e.stopPropagation()}
              >
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
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowSort(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary text-left"
                >
                  <ChevronDown className="w-4 h-4 text-muted-foreground" /> Sort: {sortMode}
                </button>
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
              </div>
            )}
          </button>
        </div>

        {/* Title */}
        <div className="px-5 pb-3 flex items-center gap-3">
          {category.id === '__priority' ? (
            <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
          ) : category.id === '__today' ? (
            <CalendarIcon className="w-5 h-5 text-sky-500" />
          ) : (
            <span className={cn('w-3.5 h-3.5 rounded-full', `bg-pastel-${category.color}`)} />
          )}
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{category.name}</h1>
          <span className="ml-auto text-sm text-muted-foreground">{incomplete.length}</span>
        </div>
      </div>

      {/* Sort sheet (simple inline) */}
      {showSort && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-[4px] flex items-end justify-center px-4 pb-32"
          style={{ zIndex: 9999 }}
          onClick={() => setShowSort(false)}
        >
          <div
            className="w-full max-w-sm bg-card rounded-3xl p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2">
              Sort by
            </p>
            {([
              ['manual', 'Manual'],
              ['date', 'Due date'],
              ['created', 'Newest first'],
            ] as [SortMode, string][]).map(([m, label]) => (
              <button
                key={m}
                onClick={() => {
                  updateTaskCategory(category.id, { sortMode: m });
                  setShowSort(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl hover:bg-secondary text-left"
              >
                <span className="flex-1">{label}</span>
                {sortMode === m && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pt-2 space-y-2">
        {/* Main (no section) tasks */}
        {mainTasks.map((task) => (
          <TaskCell key={task.id} task={task} onClick={() => setEditingTaskId(task.id)} />
        ))}

        {adding === 'main' && (
          <InlineNewTaskRow
            onSubmit={(t) => handleCreate(t)}
            onDismiss={() => setAdding(null)}
          />
        )}

        {/* Sections */}
        {sections.map((section) => {
          const sTasks = sortTasks(incomplete.filter((t) => t.sectionId === section.id), sortMode);
          const collapsed = section.collapsed;
          return (
            <div key={section.id} className="pt-3">
              <SectionHeader
                name={section.name}
                count={sTasks.length}
                collapsed={!!collapsed}
                onToggle={() => updateTaskSection(section.id, { collapsed: !collapsed })}
                onMenu={() => {
                  if (window.confirm(`Delete section "${section.name}"?`)) {
                    deleteTaskSection(section.id);
                  }
                }}
              />
              {!collapsed && (
                <div className="space-y-2 mt-1">
                  {sTasks.map((task) => (
                    <TaskCell key={task.id} task={task} onClick={() => setEditingTaskId(task.id)} />
                  ))}
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
                </div>
              )}
            </div>
          );
        })}

        {/* New section input */}
        {adding === 'new-section' && (
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
              className="flex-1 bg-secondary rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider outline-none focus:ring-2 focus:ring-primary/20"
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
          <button
            onClick={() => setAdding('new-section')}
            className="px-4 py-3 bg-card rounded-2xl text-sm font-medium text-muted-foreground shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:text-foreground transition-all"
          >
            + Section
          </button>
        </div>

        {tasks.length === 0 && adding === null && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">No tasks yet</p>
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <div className="pt-6">
            <button
              onClick={() => setShowCompleted((v) => !v)}
              className="flex items-center gap-2 px-1 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {showCompleted ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              Completed
              <span className="text-xs">{completed.length}</span>
            </button>
            {showCompleted && (
              <div className="space-y-2 mt-2 opacity-70">
                {completed.map((t) => (
                  <TaskCell key={t.id} task={t} onClick={() => setEditingTaskId(t.id)} />
                ))}
              </div>
            )}
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
