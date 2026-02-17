import { useState, useEffect } from 'react';
import { ListTodo, X, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { Task } from '@/types';

interface CalendarTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenInTasks: (task: Task) => void;
}

export function CalendarTaskModal({ task, isOpen, onClose, onOpenInTasks }: CalendarTaskModalProps) {
  const { updateTask, toggleTask, toggleSubtask, addSubtask, removeSubtask } = useAppStore();
  
  const [title, setTitle] = useState('');
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNewSubtask('');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  // Re-read task from store to get latest subtask state
  const currentTask = useAppStore.getState().tasks.find(t => t.id === task.id) || task;

  const handleSave = () => {
    updateTask(task.id, { title: title.trim() || 'Untitled' });
    onClose();
  };

  const handleOpenInTasks = () => {
    // Save any pending title change first
    if (title.trim() && title.trim() !== task.title) {
      updateTask(task.id, { title: title.trim() });
    }
    onClose();
    onOpenInTasks(task);
  };

  const handleAddSubtask = () => {
    const trimmed = newSubtask.trim();
    if (!trimmed) return;
    addSubtask(task.id, trimmed);
    setNewSubtask('');
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubtask();
    }
  };

  const handleToggleSubtask = (subtaskId: string) => {
    toggleSubtask(task.id, subtaskId);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[1100] animate-fade-in" 
        onClick={onClose} 
      />
      
      {/* Compact Bottom Sheet Modal */}
      <div className="fixed inset-x-3 z-[1200] bg-card rounded-2xl p-4 max-w-sm mx-auto animate-scale-in shadow-elevated" style={{ bottom: '40%' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-foreground">Task</h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-secondary hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Title with checkbox */}
        <div className="flex items-center gap-2.5 mb-3">
          <button
            onClick={() => toggleTask(task.id)}
            className={cn(
              'w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-all',
              currentTask.completed
                ? 'bg-primary border-primary'
                : 'border-muted-foreground/40 hover:border-primary'
            )}
          >
            {currentTask.completed && (
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground" />
              </svg>
            )}
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={cn(
              "flex-1 bg-secondary rounded-xl px-3 py-2.5 text-sm border-0 outline-none placeholder:text-muted-foreground",
              currentTask.completed ? "line-through text-muted-foreground" : "text-foreground"
            )}
            placeholder="Task title"
          />
        </div>

        {/* Subtasks */}
        {(currentTask.subtasks.length > 0 || true) && (
          <div className="mb-3">
            <span className="text-xs font-medium text-muted-foreground mb-2 block">
              Subtasks {currentTask.subtasks.length > 0 && `(${currentTask.subtasks.filter(s => s.completed).length}/${currentTask.subtasks.length})`}
            </span>
            
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {currentTask.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2.5 group">
                  {/* Circular checkbox */}
                  <button
                    onClick={() => handleToggleSubtask(subtask.id)}
                    className={cn(
                      'w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-all',
                      subtask.completed
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground/40 hover:border-primary'
                    )}
                  >
                    {subtask.completed && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground" />
                      </svg>
                    )}
                  </button>
                  
                  <span className={cn(
                    'text-sm flex-1',
                    subtask.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                  )}>
                    {subtask.title}
                  </span>
                  
                  <button
                    onClick={() => removeSubtask(task.id, subtask.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-secondary transition-all"
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add subtask input */}
            <div className="flex items-center gap-2 mt-2">
              <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={handleSubtaskKeyDown}
                className="flex-1 bg-transparent text-sm border-0 outline-none text-foreground placeholder:text-muted-foreground"
                placeholder="Add subtask..."
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleOpenInTasks}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <ListTodo className="w-4 h-4" />
            Open
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}
