import { cn } from '@/lib/utils';
import { TaskCategory, Task } from '@/types';

interface CategoryCardProps {
  category: TaskCategory;
  taskCount: number;
  onClick: () => void;
}

export function CategoryCard({ category, taskCount, onClick }: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className="flow-card-flat text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] w-full"
    >
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-foreground">{category.name}</h3>
        <p className="text-sm text-muted-foreground">
          {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
        </p>
        <div 
          className={cn(
            'h-1 w-full rounded-full mt-1',
            `bg-pastel-${category.color}`
          )} 
        />
      </div>
    </button>
  );
}
