import { useState, useEffect } from 'react';
import { isToday } from 'date-fns';
import { Star, Calendar as CalIcon, Plus, ListChecks } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Task, TaskCategory } from '@/types';
import { SmartListCard } from '../tasks/SmartListCard';
import { MyListRow } from '../tasks/MyListRow';
import { ListDetailView } from '../tasks/ListDetailView';
import { CreateListModal } from '../tasks/CreateListModal';
import { AddTaskModal } from '../tasks/AddTaskModal';

interface TasksViewProps {
  isCreatingNewTask?: boolean;
  onCreatingTaskComplete?: () => void;
}

type SmartView = 'priority' | 'today' | null;

export function TasksView({ isCreatingNewTask, onCreatingTaskComplete }: TasksViewProps) {
  const { tasks, taskCategories, searchQuery } = useAppStore();

  const [selectedList, setSelectedList] = useState<TaskCategory | null>(null);
  const [smartView, setSmartView] = useState<SmartView>(null);
  const [showCreateList, setShowCreateList] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);

  useEffect(() => {
    if (isCreatingNewTask) {
      setShowAddTask(true);
      onCreatingTaskComplete?.();
    }
  }, [isCreatingNewTask, onCreatingTaskComplete]);

  const matches = (t: Task) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.title.toLowerCase().includes(q) || (t.note ?? '').toLowerCase().includes(q);
  };

  const visible = tasks.filter((t) => !t.hidden && matches(t));
  const incomplete = visible.filter((t) => !t.completed);

  const todayCount = incomplete.filter(
    (t) => t.date && (isToday(new Date(t.date)) || new Date(t.date) < new Date()),
  ).length;
  const priorityCount = incomplete.filter((t) => t.priority !== 'none').length;

  const pinned = taskCategories.filter((c) => c.pinned).slice(0, 2);
  const pinnedSlots: (TaskCategory | null)[] = [pinned[0] ?? null, pinned[1] ?? null];

  const myLists = [...taskCategories].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );

  // ── List detail view
  if (selectedList) {
    const listTasks = visible.filter((t) => t.category === selectedList.name);
    return (
      <ListDetailView
        category={selectedList}
        tasks={listTasks}
        onBack={() => setSelectedList(null)}
      />
    );
  }

  // ── Smart list virtual category
  if (smartView) {
    const virtual: TaskCategory =
      smartView === 'priority'
        ? { id: '__priority', name: 'Priority', color: 'amber' }
        : { id: '__today', name: 'Today', color: 'sky' };

    const filtered =
      smartView === 'priority'
        ? visible.filter((t) => t.priority !== 'none')
        : visible.filter(
            (t) =>
              t.date && (isToday(new Date(t.date)) || new Date(t.date) < new Date()),
          );

    return (
      <ListDetailView
        category={virtual}
        tasks={filtered}
        onBack={() => setSmartView(null)}
      />
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 pt-3 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 px-1">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Tasks</h1>
          <button
            onClick={() => setShowAddTask(true)}
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-transform"
            aria-label="New task"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Smart Lists 2x2 */}
        <div className="grid grid-cols-2 gap-3 mb-7">
          <div className="stagger-item">
            <SmartListCard
              title="Priority"
              count={priorityCount}
              icon={Star}
              color="amber-warm"
              onClick={() => setSmartView('priority')}
            />
          </div>
          <div className="stagger-item">
            <SmartListCard
              title="Today"
              count={todayCount}
              icon={CalIcon}
              color="sky"
              onClick={() => setSmartView('today')}
            />
          </div>
          {pinnedSlots.map((slot, i) => (
            <div key={i} className="stagger-item">
              {slot ? (
                <SmartListCard
                  title={slot.name}
                  count={incomplete.filter((t) => t.category === slot.name).length}
                  icon={ListChecks}
                  color={slot.color}
                  onClick={() => setSelectedList(slot)}
                />
              ) : (
                <SmartListCard
                  title="Pin a list"
                  count={0}
                  icon={Plus}
                  color="stone"
                  empty
                  emptyLabel="Long-press a list to pin"
                  onClick={() => {}}
                />
              )}
            </div>
          ))}
        </div>

        {/* My Lists */}
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            My Lists
          </h2>
          <button
            onClick={() => setShowCreateList(true)}
            className="text-xs font-medium text-primary hover:opacity-70 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> New list
          </button>
        </div>

        <div className="space-y-2">
          {myLists.map((cat, idx) => (
            <div key={cat.id} className="stagger-item" style={{ animationDelay: `${idx * 30}ms` }}>
              <MyListRow
                category={cat}
                count={incomplete.filter((t) => t.category === cat.name).length}
                onClick={() => setSelectedList(cat)}
              />
            </div>
          ))}

          {myLists.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground mb-3">No lists yet</p>
              <button
                onClick={() => setShowCreateList(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
              >
                Create your first list
              </button>
            </div>
          )}
        </div>
      </div>

      <CreateListModal isOpen={showCreateList} onClose={() => setShowCreateList(false)} />
      <AddTaskModal isOpen={showAddTask} onClose={() => setShowAddTask(false)} />
    </div>
  );
}
