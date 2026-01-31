import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { TaskCategory } from '@/types';
import { SwipeableTaskCard } from '../tasks/SwipeableTaskCard';
import { CompletedTaskCard } from '../tasks/CompletedTaskCard';
import { CategoryCard } from '../tasks/CategoryCard';
import { CategoryDetailView } from '../tasks/CategoryDetailView';
import { InlineTaskInput } from '../tasks/InlineTaskInput';
import { useUndoableDelete } from '@/hooks/useUndoableDelete';

type TabType = 'tasks' | 'categories' | 'completed';

interface TasksViewProps {
  isCreatingNewTask?: boolean;
  onCreatingTaskComplete?: () => void;
}

export function TasksView({ isCreatingNewTask, onCreatingTaskComplete }: TasksViewProps) {
  const { 
    tasks, 
    toggleTask, 
    hideTask,
    unhideTask,
    searchQuery, 
    taskCategories 
  } = useAppStore();
  const { deleteWithUndo } = useUndoableDelete();
  
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | null>(null);

  // Auto-switch to tasks tab when creating new task
  useEffect(() => {
    if (isCreatingNewTask) {
      setActiveTab('tasks');
    }
  }, [isCreatingNewTask]);

  // Filter tasks based on search and hidden status (completed tasks stay visible)
  const activeTasks = tasks.filter(task => {
    if (task.hidden) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return task.title.toLowerCase().includes(query) || 
             task.category.toLowerCase().includes(query);
    }
    return true;
  });

  // Completed tasks (regardless of hidden status)
  const completedTasks = tasks.filter(task => task.completed);

  // Show category detail view
  if (selectedCategory) {
    const categoryTasks = activeTasks.filter(t => t.category === selectedCategory.name);
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
        {/* Tab Navigation */}
        <div className="flow-segment mb-4">
          {(['tasks', 'categories', 'completed'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flow-segment-item capitalize',
                activeTab === tab && 'flow-segment-item-active'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-2">
            {activeTasks.map((task, index) => (
              <div key={task.id} className="stagger-item" style={{ animationDelay: `${index * 40}ms` }}>
                <SwipeableTaskCard
                  task={task}
                  onToggle={() => toggleTask(task.id)}
                />
              </div>
            ))}

            {/* Inline Task Input - Always visible at the bottom */}
            <InlineTaskInput 
              autoFocus={isCreatingNewTask} 
            />

            {activeTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">All caught up!</h3>
                <p className="text-sm text-muted-foreground">Add a task above to get started</p>
              </div>
            )}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-2 gap-3">
            {taskCategories.map((category, index) => {
              const taskCount = activeTasks.filter(t => t.category === category.name).length;
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
                <p className="text-sm text-muted-foreground">No categories yet</p>
              </div>
            )}
          </div>
        )}

        {/* Completed Tab */}
        {activeTab === 'completed' && (
          <div className="space-y-2">
            {completedTasks.map((task, index) => (
              <div key={task.id} className="stagger-item" style={{ animationDelay: `${index * 40}ms` }}>
                <CompletedTaskCard
                  task={task}
                  onHide={() => hideTask(task.id)}
                  onUnhide={() => unhideTask(task.id)}
                  onDelete={() => deleteWithUndo('task', task)}
                />
              </div>
            ))}

            {completedTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">No completed tasks</h3>
                <p className="text-sm text-muted-foreground">Check off a task to see it here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
