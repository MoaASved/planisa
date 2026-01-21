import { useState } from 'react';
import { Check, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { TaskCategory } from '@/types';
import { SwipeableTaskCard } from '../tasks/SwipeableTaskCard';
import { CategoryCard } from '../tasks/CategoryCard';
import { CategoryDetailView } from '../tasks/CategoryDetailView';
import { InlineTaskInput } from '../tasks/InlineTaskInput';

type TabType = 'tasks' | 'categories' | 'completed';

export function TasksView() {
  const { 
    tasks, 
    toggleTask, 
    hideTask, 
    unhideTask,
    searchQuery, 
    taskCategories 
  } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | null>(null);

  // Filter tasks based on search and hidden status
  const activeTasks = tasks.filter(task => {
    if (task.hidden) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return task.title.toLowerCase().includes(query) || 
             task.category.toLowerCase().includes(query);
    }
    return true;
  });

  const hiddenTasks = tasks.filter(task => task.hidden);

  // Show category detail view
  if (selectedCategory) {
    const categoryTasks = activeTasks.filter(t => t.category === selectedCategory.name);
    return (
      <CategoryDetailView
        category={selectedCategory}
        tasks={categoryTasks}
        onBack={() => setSelectedCategory(null)}
        onToggleTask={toggleTask}
        onHideTask={hideTask}
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
            {activeTasks.map((task) => (
              <SwipeableTaskCard
                key={task.id}
                task={task}
                onToggle={() => toggleTask(task.id)}
                onHide={() => hideTask(task.id)}
              />
            ))}

            {/* Inline Task Input - Always visible at the bottom */}
            <InlineTaskInput />

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
            {taskCategories.map((category) => {
              const taskCount = activeTasks.filter(t => t.category === category.name).length;
              return (
                <CategoryCard
                  key={category.id}
                  category={category}
                  taskCount={taskCount}
                  onClick={() => setSelectedCategory(category)}
                />
              );
            })}

            {taskCategories.length === 0 && (
              <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm text-muted-foreground">No categories yet</p>
              </div>
            )}
          </div>
        )}

        {/* Completed/Hidden Tab */}
        {activeTab === 'completed' && (
          <div className="space-y-2">
            {hiddenTasks.map((task) => (
              <div 
                key={task.id}
                className="flow-card-flat opacity-60"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-6 h-6 rounded-lg border-2 flex items-center justify-center',
                      task.completed ? 'bg-primary border-primary' : 'border-muted-foreground'
                    )}>
                      {task.completed && <Check className="w-4 h-4 text-primary-foreground" />}
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground line-through">{task.title}</p>
                      <span className={cn('flow-badge mt-1', `flow-badge-${task.color}`)}>
                        {task.category}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => unhideTask(task.id)}
                    className="p-2 rounded-xl hover:bg-secondary transition-colors"
                    title="Unhide task"
                  >
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}

            {hiddenTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center mb-4">
                  <Eye className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">No hidden tasks</h3>
                <p className="text-sm text-muted-foreground">Swipe left on a task to hide it</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
