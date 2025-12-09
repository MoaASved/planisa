import { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  addYears,
  subYears,
  startOfWeek
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { CalendarView, PastelColor, Task, CalendarEvent, Note } from '@/types';
import { ViewSelector } from '@/components/calendar/ViewSelector';
import { YearView } from '@/components/calendar/YearView';
import { MonthView } from '@/components/calendar/MonthView';
import { WeekView } from '@/components/calendar/WeekView';
import { DayView } from '@/components/calendar/DayView';
import { EditEventModal } from '@/components/modals/EditEventModal';
import { EditTaskModal } from '@/components/modals/EditTaskModal';
import { EditNoteModal } from '@/components/modals/EditNoteModal';

export function CalendarViewComponent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
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
    if (view === 'year') setCurrentDate(subYears(currentDate, 1));
    else if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, -1));
  };

  const handleNext = () => {
    if (view === 'year') setCurrentDate(addYears(currentDate, 1));
    else if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleViewChange = (newView: CalendarView) => {
    setView(newView);
  };

  const handleMonthClick = (date: Date) => {
    setCurrentDate(date);
    setView('month');
  };

  const handleDayClickFromMonth = (date: Date) => {
    setSelectedDate(date);
    setCurrentDate(startOfWeek(date, { weekStartsOn: 1 }));
    setView('week');
  };

  const handleDayClickFromWeek = (date: Date) => {
    setSelectedDate(date);
    setCurrentDate(date);
    setView('day');
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

  const getHeaderText = () => {
    if (view === 'year') return format(currentDate, 'yyyy');
    if (view === 'month') return format(currentDate, 'MMMM yyyy');
    if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      return format(weekStart, 'MMMM yyyy');
    }
    return format(currentDate, 'MMMM yyyy');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        {/* View Selector - centered */}
        <ViewSelector view={view} onViewChange={handleViewChange} />
        
        {/* Navigation row */}
        <div className="flex items-center justify-between mt-4">
          <h2 className="text-xl font-semibold text-foreground">
            {getHeaderText()}
          </h2>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrev} 
              className="p-2 rounded-full hover:bg-secondary/60 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
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

      {/* Main content area */}
      <div className="flex-1 overflow-hidden px-4 pb-4">
        <div className={cn(
          'h-full',
          view === 'year' && 'animate-view-zoom-in',
          view === 'month' && 'animate-view-zoom-in',
          view === 'week' && 'animate-view-slide-left',
          view === 'day' && 'animate-view-slide-left'
        )}>
          {view === 'year' && (
            <YearView
              currentDate={currentDate}
              onMonthClick={handleMonthClick}
            />
          )}

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
            />
          )}
        </div>
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
      
      <EditNoteModal
        note={editingNote}
        isOpen={!!editingNote}
        onClose={() => setEditingNote(null)}
      />
    </div>
  );
}
