import { useState, useEffect } from 'react';
import { Star, Calendar as CalIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { Task, TaskCategory } from '@/types';
import { TaskRow } from '../tasks/TaskRow';
import { CategoryCard } from '../tasks/CategoryCard';
import { CategoryDetailView } from '../tasks/CategoryDetailView';
import { InlineTaskInput } from '../tasks/InlineTaskInput';

type TabType = 'tasks' | 'categories';

interface TasksViewProps {
  isCreatingNewTask?: boolean;
  onCreatingTaskComplete?: () => void;
}

const VISIBLE_COUNT = 3;

/** Section with up to 3 vertical rows + horizontal swipe carousel for the rest */
function TaskSection({
  title,
  icon,
  tasks,
  toggleTask,
  emptyText,
  showOverdue,
}: {
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
  toggleTask: (id: string) => void;
  emptyText: string;
  showOverdue?: boolean;
}) {
  const visible = tasks.slice(0, VISIBLE_COUNT);
  const overflow = tasks.slice(VISIBLE_COUNT);

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-semibold text-foreground tracking-tight">{title}</h2>
        </div>
        {tasks.length > 0 && (
          <span className="text-xs text-muted-foreground">{tasks.length}</span>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="flow-card-flat flex items-center justify-center py-6">
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {visible.map((task) => (
              <div key={task.id} className="stagger-item">
                <TaskRow
                  task={task}
                  onToggle={() => toggleTask(task.id)}
                  showOverdue={showOverdue}
                />
              </div>
            ))}
          </div>

          {overflow.length > 0 && (
            <div className="-mx-4 px-4 overflow-x-auto scrollbar-none snap-x snap-mandatory">
              <div className="flex gap-2 pb-1">
                {overflow.map((task) => (
                  <div
                    key={task.id}
                    className="snap-start shrink-0 w-[78%]"
                  >
                    <TaskRow
                      task={task}
                      onToggle={() => toggleTask(task.id)}
                      showOverdue={showOverdue}
                      compact
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export function TasksView({ isCreatingNewTask, onCreatingTaskComplete }: TasksViewProps) {
  const { tasks, toggleTask, searchQuery, taskCategories } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    if (isCreatingNewTask) setActiveTab('tasks');
  }, [isCreatingNewTask]);

  // Search filter helper
  const matchesSearch = (t: Task) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
  };

  const visibleTasks = tasks.filter((t) => !t.hidden && matchesSearch(t));

  // Today: tasks with date == today AND not completed
  // Overdue: tasks with date < today AND not completed → also surface in Today
  const todayMidnight = new Date().setHours(0, 0, 0, 0);
  const todayTasks = visibleTasks
    .filter((t) => !t.completed && t.date && isToday(new Date(t.date)));
  const overdueTasks = visibleTasks
    .filter((t) => !t.completed && t.date && new Date(t.date).setHours(0, 0, 0, 0) < todayMidnight);
  const todayCombined = [...overdueTasks, ...todayTasks];

  // Priority: any non-'none' priority, regardless of date
  const priorityTasks = visibleTasks.filter((t) => t.priority !== 'none' && !t.completed);

  // Completed today (collapsible)
  const completedToday = visibleTasks.filter(
    (t) => t.completed && t.date && isToday(new Date(t.date)),
  );

  // Category detail view
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

        {/* TASKS TAB — dashboard */}
        {activeTab === 'tasks' && (
          <div className="space-y-5">
            <TaskSection
              title="Today"
              icon={<CalIcon className="w-4 h-4 text-primary" />}
              tasks={todayCombined}
              toggleTask={toggleTask}
              emptyText="Nothing scheduled today"
              showOverdue
            />

            <TaskSection
              title="Priority"
              icon={<Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
              tasks={priorityTasks}
              toggleTask={toggleTask}
              emptyText="No priority tasks"
            />

            {/* Completed (collapsible) */}
            {completedToday.length > 0 && (
              <section className="space-y-2">
                <button
                  onClick={() => setShowCompleted((v) => !v)}
                  className="flex items-center gap-2 px-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCompleted ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
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

            {/* Quick add */}
            <div className="pt-1">
              <InlineTaskInput
                autoFocus={isCreatingNewTask}
                onTaskCreated={() => onCreatingTaskComplete?.()}
              />
            </div>
          </div>
        )}

        {/* LISTS TAB */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-2 gap-3">
            {taskCategories.map((category, index) => {
              const taskCount = visibleTasks.filter((t) => t.category === category.name).length;
              return (
                <div key={category.id} className="stagger-item" style={{ animationDelay: `${index * 50}ms` }}>
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
