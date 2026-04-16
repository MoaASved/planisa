import { useState, useEffect, useRef } from 'react';
import { Star, Calendar as CalIcon, ChevronDown, ChevronRight, Plus, Inbox } from 'lucide-react';
import { isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { Task, TaskCategory } from '@/types';
import { TaskRow } from '../tasks/TaskRow';
import { CategoryCard } from '../tasks/CategoryCard';
import { CategoryDetailView } from '../tasks/CategoryDetailView';
import { InlineTaskInput, InlineTaskInputMode } from '../tasks/InlineTaskInput';

type TabType = 'tasks' | 'categories';

interface TasksViewProps {
  isCreatingNewTask?: boolean;
  onCreatingTaskComplete?: () => void;
}

const VISIBLE_COUNT = 3;

function TaskSection({
  title,
  icon,
  tasks,
  toggleTask,
  emptyText,
  showOverdue,
  inputMode,
  isAdding,
  onToggleAdd,
  onTaskCreated,
}: {
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
  toggleTask: (id: string) => void;
  emptyText: string;
  showOverdue?: boolean;
  inputMode: InlineTaskInputMode;
  isAdding: boolean;
  onToggleAdd: () => void;
  onTaskCreated: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeColumn, setActiveColumn] = useState(0);

  const columns: Task[][] = [];
  for (let i = 0; i < tasks.length; i += VISIBLE_COUNT) {
    columns.push(tasks.slice(i, i + VISIBLE_COUNT));
  }

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== activeColumn) setActiveColumn(idx);
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-semibold text-foreground tracking-tight">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {tasks.length > 0 && (
            <span className="text-xs text-muted-foreground">{tasks.length}</span>
          )}
          <button
            onClick={onToggleAdd}
            aria-label={`Add to ${title}`}
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center transition-all',
              'hover:bg-muted active:scale-95',
              isAdding && 'bg-primary/10 text-primary rotate-45',
            )}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="stagger-item">
          <InlineTaskInput
            mode={inputMode}
            autoFocus
            onTaskCreated={onTaskCreated}
            onDismiss={onToggleAdd}
          />
        </div>
      )}

      {tasks.length === 0 && !isAdding ? (
        <div className="flow-card-flat flex items-center justify-center py-6">
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        </div>
      ) : tasks.length > 0 ? (
        <>
          {columns.length === 1 ? (
            <div className="space-y-2">
              {columns[0].map((task) => (
                <div key={task.id} className="stagger-item">
                  <TaskRow
                    task={task}
                    onToggle={() => toggleTask(task.id)}
                    showOverdue={showOverdue}
                  />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="-mx-4 px-4 overflow-x-auto scrollbar-none snap-x snap-mandatory"
              >
                <div className="flex gap-3">
                  {columns.map((col, colIdx) => (
                    <div
                      key={colIdx}
                      className="snap-start shrink-0 w-full space-y-2"
                      style={{ width: 'calc(100vw - 2rem)' }}
                    >
                      {col.map((task) => (
                        <div key={task.id} className="stagger-item">
                          <TaskRow
                            task={task}
                            onToggle={() => toggleTask(task.id)}
                            showOverdue={showOverdue}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center gap-1.5 pt-1">
                {columns.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      i === activeColumn ? 'w-4 bg-foreground/60' : 'w-1.5 bg-foreground/20',
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </>
      ) : null}
    </section>
  );
}

export function TasksView({ isCreatingNewTask, onCreatingTaskComplete }: TasksViewProps) {
  const { tasks, toggleTask, searchQuery, taskCategories } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const [addingSection, setAddingSection] = useState<InlineTaskInputMode | null>(null);

  useEffect(() => {
    if (isCreatingNewTask) {
      setActiveTab('tasks');
      setAddingSection('uncategorized');
      onCreatingTaskComplete?.();
    }
  }, [isCreatingNewTask, onCreatingTaskComplete]);

  const matchesSearch = (t: Task) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
  };

  const visibleTasks = tasks.filter((t) => !t.hidden && matchesSearch(t));

  const todayMidnight = new Date().setHours(0, 0, 0, 0);
  const todayTasks = visibleTasks.filter(
    (t) => !t.completed && t.date && isToday(new Date(t.date)),
  );
  const overdueTasks = visibleTasks.filter(
    (t) => !t.completed && t.date && new Date(t.date).setHours(0, 0, 0, 0) < todayMidnight,
  );
  const todayCombined = [...overdueTasks, ...todayTasks];

  const priorityTasks = visibleTasks.filter((t) => t.priority !== 'none' && !t.completed);

  const uncategorizedTasks = visibleTasks.filter(
    (t) => !t.completed && !t.date && t.priority === 'none' && !t.category,
  );

  const completedToday = visibleTasks.filter(
    (t) => t.completed && t.date && isToday(new Date(t.date)),
  );

  if (selectedCategory) {
    const categoryTasks = visibleTasks.filter((t) => t.category === selectedCategory.name);
    return (
      <CategoryDetailView
        category={selectedCategory}
        tasks={categoryTasks}
        onBack={() => setSelectedCategory(null)}
        onToggleTask={toggleTask}
      />
    );
  }

  const toggleAdd = (mode: InlineTaskInputMode) => {
    setAddingSection((cur) => (cur === mode ? null : mode));
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 py-4">
        {/* Tabs */}
        <div className="flow-segment mb-4">
          {(['tasks', 'categories'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flow-segment-item capitalize',
                activeTab === tab && 'flow-segment-item-active',
              )}
            >
              {tab === 'categories' ? 'Lists' : 'Tasks'}
            </button>
          ))}
        </div>

        {activeTab === 'tasks' && (
          <div className="space-y-5">
            <TaskSection
              title="Today"
              icon={<CalIcon className="w-4 h-4 text-primary" />}
              tasks={todayCombined}
              toggleTask={toggleTask}
              emptyText="Nothing scheduled today"
              showOverdue
              inputMode="today"
              isAdding={addingSection === 'today'}
              onToggleAdd={() => toggleAdd('today')}
              onTaskCreated={() => {}}
            />

            <TaskSection
              title="Priority"
              icon={<Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
              tasks={priorityTasks}
              toggleTask={toggleTask}
              emptyText="No priority tasks"
              inputMode="priority"
              isAdding={addingSection === 'priority'}
              onToggleAdd={() => toggleAdd('priority')}
              onTaskCreated={() => {}}
            />

            {(uncategorizedTasks.length > 0 || addingSection === 'uncategorized') && (
              <TaskSection
                title="Tasks without category"
                icon={<Inbox className="w-4 h-4 text-muted-foreground" />}
                tasks={uncategorizedTasks}
                toggleTask={toggleTask}
                emptyText="No uncategorized tasks"
                inputMode="uncategorized"
                isAdding={addingSection === 'uncategorized'}
                onToggleAdd={() => toggleAdd('uncategorized')}
                onTaskCreated={() => {}}
              />
            )}

            {/* Hidden trigger so users can always reach uncategorized add */}
            {uncategorizedTasks.length === 0 && addingSection !== 'uncategorized' && (
              <button
                onClick={() => toggleAdd('uncategorized')}
                className="w-full flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add uncategorized task</span>
              </button>
            )}

            {completedToday.length > 0 && (
              <section className="space-y-2">
                <button
                  onClick={() => setShowCompleted((v) => !v)}
                  className="flex items-center gap-2 px-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCompleted ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <span>Completed</span>
                  <span className="text-xs">({completedToday.length})</span>
                </button>
                {showCompleted && (
                  <div className="space-y-2">
                    {completedToday.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onToggle={() => toggleTask(task.id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="grid grid-cols-2 gap-3">
            {taskCategories.map((category, index) => {
              const taskCount = visibleTasks.filter((t) => t.category === category.name).length;
              return (
                <div
                  key={category.id}
                  className="stagger-item"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CategoryCard
                    category={category}
                    taskCount={taskCount}
                    onClick={() => setSelectedCategory(category)}
                  />
                </div>
              );
            })}

            {taskCategories.length === 0 && (
              <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm text-muted-foreground">No lists yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
