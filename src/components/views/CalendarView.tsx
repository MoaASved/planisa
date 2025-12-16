import { useState } from 'react';
import { addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { useAppStore } from '@/store/useAppStore';
import { PastelColor, Task, CalendarEvent, Note } from '@/types';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { YearView } from '@/components/calendar/YearView';
import { MonthView } from '@/components/calendar/MonthView';
import { WeekDayView } from '@/components/calendar/WeekDayView';
import { EditEventModal } from '@/components/modals/EditEventModal';
import { EditTaskModal } from '@/components/modals/EditTaskModal';
import { CalendarNoteModal } from '@/components/modals/CalendarNoteModal';
import { NoteEditor } from '@/components/notes/NoteEditor';

type SimpleView = 'month' | 'weekday';

export function CalendarViewComponent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<SimpleView>('month');
  const [showYearView, setShowYearView] = useState(false);
  
  const { events, tasks, notes, toggleTask, taskCategories, eventCategories, folders } = useAppStore();

  // Edit modal states
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showNoteEditor, setShowNoteEditor] = useState(false);

  // Filter notes to only show those with showInCalendar enabled
  const calendarNotes = notes.filter(n => n.showInCalendar);

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
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const handleMonthClick = () => {
    setShowYearView(!showYearView);
  };

  const handleYearMonthSelect = (date: Date) => {
    setCurrentDate(date);
    setShowYearView(false);
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

  const handleOpenFullNoteEditor = (note: Note) => {
    setEditingNote(note);
    setShowNoteEditor(true);
  };

  const handleCloseNoteModal = () => {
    setEditingNote(null);
    setShowNoteEditor(false);
  };

  const handleTaskToggle = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    toggleTask(taskId);
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleWeekChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] overflow-x-hidden">
      {/* Header */}
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        showYearView={showYearView}
        onPrev={handlePrev}
        onNext={handleNext}
        onMonthClick={handleMonthClick}
        onViewChange={setView}
      />

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {showYearView ? (
          <div className="h-full overflow-y-auto px-2">
            <YearView
              currentDate={currentDate}
              onMonthClick={handleYearMonthSelect}
            />
          </div>
        ) : view === 'month' ? (
          <MonthView
            currentDate={currentDate}
            events={events}
            tasks={tasks}
            notes={calendarNotes}
            getItemColor={getItemColor}
            getNoteColor={getNoteColor}
            onItemClick={handleItemClick}
            onTaskToggle={handleTaskToggle}
            onMonthChange={handleMonthChange}
          />
        ) : (
          <WeekDayView
            currentDate={currentDate}
            events={events}
            tasks={tasks}
            notes={calendarNotes}
            getItemColor={getItemColor}
            getNoteColor={getNoteColor}
            onItemClick={handleItemClick}
            onTaskToggle={handleTaskToggle}
            onWeekChange={handleWeekChange}
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
      
      <CalendarNoteModal
        note={editingNote}
        isOpen={!!editingNote && !showNoteEditor}
        onClose={handleCloseNoteModal}
        onOpenFullEditor={handleOpenFullNoteEditor}
      />
      
      {showNoteEditor && editingNote && (
        <NoteEditor
          note={editingNote}
          onClose={handleCloseNoteModal}
        />
      )}
    </div>
  );
}