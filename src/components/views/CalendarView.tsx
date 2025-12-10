import { 
  format, 
  addMonths, 
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  startOfWeek
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { CalendarView, PastelColor, Task, CalendarEvent, Note } from '@/types';
import { YearView } from '@/components/calendar/YearView';
import { MonthView } from '@/components/calendar/MonthView';
import { WeekView } from '@/components/calendar/WeekView';
import { DayView } from '@/components/calendar/DayView';
import { EditEventModal } from '@/components/modals/EditEventModal';
import { EditTaskModal } from '@/components/modals/EditTaskModal';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { useState } from 'react';

interface CalendarViewComponentProps {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onExitYearView: () => void;
}

export function CalendarViewComponent({
  view,
  onViewChange,
  currentDate,
  onDateChange,
  onExitYearView,
}: CalendarViewComponentProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { events, tasks, notes, toggleTask, taskCategories, eventCategories, folders } = useAppStore();

  // Edit modal states
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Get effective color: manual color > category color
  const getItemColor = (item: Task | CalendarEvent, type: 'task' | 'event'): PastelColor => {
    if (item.color) return item.color;
    
    if (type === 'task') {
      const task = item as Task;
      const category = taskCategories.find(c => c.name === task.category);
      return category?.color || 'sky';
    } else {
      const event = item as CalendarEvent;
      const category = eventCategories.find(c => c.name === event.category);
      return category?.color || 'sky';
    }
  };

  const getNoteColor = (note: Note): PastelColor => {
    if (note.color) return note.color;
    const folder = folders.find(f => f.name === note.folder);
    return folder?.color || 'sky';
  };

  const handlePrev = () => {
    if (view === 'month') onDateChange(subMonths(currentDate, 1));
    else if (view === 'week') onDateChange(subWeeks(currentDate, 1));
    else onDateChange(addDays(currentDate, -1));
  };

  const handleNext = () => {
    if (view === 'month') onDateChange(addMonths(currentDate, 1));
    else if (view === 'week') onDateChange(addWeeks(currentDate, 1));
    else onDateChange(addDays(currentDate, 1));
  };

  const handleMonthClick = (date: Date) => {
    onDateChange(date);
    onViewChange('month');
    onExitYearView();
  };

  const handleDayClickFromMonth = (date: Date) => {
    setSelectedDate(date);
    onDateChange(startOfWeek(date, { weekStartsOn: 1 }));
    onViewChange('week');
  };

  const handleDayClickFromWeek = (date: Date) => {
    setSelectedDate(date);
    onDateChange(date);
    onViewChange('day');
  };

  const handleDayClickFromDayHeader = (date: Date) => {
    onDateChange(date);
  };

  const handleItemClick = (item: Task | CalendarEvent | Note, type: 'task' | 'event' | 'note') => {
    if (type === 'event') {
      setEditingEvent(item as CalendarEvent);
    } else if (type === 'task') {
      setEditingTask(item as Task);
    } else {
      setEditingNote(item as Note);
    }
  };

  const handleTaskToggle = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    toggleTask(taskId);
  };

  const getNavigationText = () => {
    if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      return format(weekStart, 'MMMM yyyy');
    }
    return format(currentDate, 'MMMM yyyy');
  };

  // Year view - fullscreen without extra navigation
  if (view === 'year') {
    return (
      <div className="flex flex-col h-[calc(100vh-160px)]">
        <div className="flex-1 overflow-hidden px-4">
          <YearView
            currentDate={currentDate}
            onMonthClick={handleMonthClick}
          />
        </div>

        {/* Edit Modals */}
        <EditEventModal
          event={editingEvent}
          isOpen={!!editingEvent}
          onClose={() => setEditingEvent(null)}
        />
        
        <EditTaskModal
          task={editingTask}
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
        />
        
        {editingNote && (
          <NoteEditor
            note={editingNote}
            onClose={() => setEditingNote(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-160px)]">
      {/* Compact navigation row for Day and Week views */}
      {(view === 'day' || view === 'week') && (
        <div className="flex-shrink-0 px-4 py-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {getNavigationText()}
            </h2>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={handlePrev} 
                className="p-2 rounded-full hover:bg-secondary/60 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </button>
              <button
                onClick={() => onDateChange(new Date())}
                className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                Today
              </button>
              <button 
                onClick={handleNext} 
                className="p-2 rounded-full hover:bg-secondary/60 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content area - fullscreen */}
      <div className={cn(
        "flex-1 overflow-hidden",
        view !== 'month' && "px-4"
      )}>
        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            selectedDate={selectedDate}
            events={events}
            tasks={tasks}
            notes={notes}
            getItemColor={getItemColor}
            getNoteColor={getNoteColor}
            onDayClick={handleDayClickFromMonth}
            onDateChange={onDateChange}
          />
        )}

        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            selectedDate={selectedDate}
            events={events}
            tasks={tasks}
            notes={notes}
            getItemColor={getItemColor}
            getNoteColor={getNoteColor}
            onDayClick={handleDayClickFromWeek}
            onItemClick={handleItemClick}
            onTaskToggle={handleTaskToggle}
            onSwipeLeft={handleNext}
            onSwipeRight={handlePrev}
          />
        )}

        {view === 'day' && (
          <DayView
            currentDate={currentDate}
            events={events}
            tasks={tasks}
            notes={notes}
            getItemColor={getItemColor}
            getNoteColor={getNoteColor}
            onItemClick={handleItemClick}
            onTaskToggle={handleTaskToggle}
            onDayClick={handleDayClickFromDayHeader}
            onSwipeLeft={handleNext}
            onSwipeRight={handlePrev}
          />
        )}
      </div>

      {/* Edit Modals */}
      <EditEventModal
        event={editingEvent}
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
      />
      
      <EditTaskModal
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
      />
      
      {editingNote && (
        <NoteEditor
          note={editingNote}
          onClose={() => setEditingNote(null)}
        />
      )}
    </div>
  );
}
