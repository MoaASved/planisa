import { useState } from 'react';
import { addMonths, subMonths, addWeeks, subWeeks, addDays, startOfWeek, startOfMonth } from 'date-fns';
import { useAppStore } from '@/store/useAppStore';
import { PastelColor, Task, CalendarEvent, Note } from '@/types';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { YearView } from '@/components/calendar/YearView';
import { MonthView } from '@/components/calendar/MonthView';
import { WeekDayView } from '@/components/calendar/WeekDayView';
import { EditEventModal } from '@/components/modals/EditEventModal';
import { CreateEventModal } from '@/components/modals/CreateEventModal';
import { CalendarNoteModal } from '@/components/modals/CalendarNoteModal';
import { CalendarNoteCreateSheet } from '@/components/modals/CalendarNoteCreateSheet';
import { CalendarStickyCreateSheet } from '@/components/modals/CalendarStickyCreateSheet';
import { AddTaskModal } from '@/components/tasks/AddTaskModal';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { StickyNoteEditor } from '@/components/notes/StickyNoteEditor';

type SimpleView = 'month' | 'weekday';

export function CalendarViewComponent({ onDateChange, onNavigateToTasks }: { onDateChange?: (date: Date) => void; onNavigateToTasks?: (task: Task) => void }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<SimpleView>('month');
  const [showYearView, setShowYearView] = useState(false);
  
  const { events, tasks, notes, toggleTask, taskCategories, eventCategories, folders, notebookPages } = useAppStore();

  // Edit modal states
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingStickyNote, setEditingStickyNote] = useState<Note | null>(null);
  const [showNoteEditor, setShowNoteEditor] = useState(false);

  // Timeline create states
  const [showTimelineCreateEvent, setShowTimelineCreateEvent] = useState(false);
  const [showTimelineCreateTask, setShowTimelineCreateTask] = useState(false);
  const [showTimelineCreateNote, setShowTimelineCreateNote] = useState(false);
  const [showTimelineCreateSticky, setShowTimelineCreateSticky] = useState(false);
  const [timelineCreateTime, setTimelineCreateTime] = useState<string>('');

  // Filter notes to only show those with showInCalendar enabled
  const calendarNotes: Note[] = [
    ...notes.filter(n => n.showInCalendar),
    // Include notebook pages with showInCalendar as Note-like objects
    ...notebookPages
      .filter(p => p.showInCalendar)
      .map(p => ({
        id: `nbp-${p.id}`,
        title: p.title || 'Untitled',
        content: p.content,
        type: 'note' as const,
        tags: [],
        color: p.color,
        date: p.date ? new Date(p.date) : p.createdAt ? new Date(p.createdAt) : new Date(),
        time: p.time,
        endTime: p.endTime,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
        isPinned: false,
        showInCalendar: true,
        hideDate: p.hideDate,
      })),
  ];

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
    setSelectedDate(date);
    setShowYearView(false);
  };

  const handleTodayClick = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onDateChange?.(date);
  };

  const handleItemClick = (item: Task | CalendarEvent | Note, type: 'task' | 'event' | 'note') => {
    if (type === 'event') {
      setEditingEvent(item as CalendarEvent);
    } else if (type === 'task') {
      setEditingTask(item as Task);
    } else {
      const note = item as Note;
      if (note.type === 'sticky') {
        setEditingStickyNote(note);
      } else {
        setEditingNote(note);
      }
    }
  };

  const handleOpenFullNoteEditor = (note: Note) => {
    if (note.type === 'sticky') {
      setEditingNote(null);
      setEditingStickyNote(note);
    } else {
      setEditingNote(note);
      setShowNoteEditor(true);
    }
  };

  const handleCloseNoteModal = () => {
    setEditingNote(null);
    setEditingStickyNote(null);
    setShowNoteEditor(false);
  };

  const handleTaskToggle = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    toggleTask(taskId);
  };

  const handleCreateFromTimeline = (type: 'event' | 'task' | 'note' | 'sticky', time: string) => {
    setTimelineCreateTime(time);
    if (type === 'event') {
      setShowTimelineCreateEvent(true);
    } else if (type === 'task') {
      setShowTimelineCreateTask(true);
    } else if (type === 'note') {
      setShowTimelineCreateNote(true);
    } else if (type === 'sticky') {
      setShowTimelineCreateSticky(true);
    }
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleWeekChange = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev'
      ? subWeeks(currentDate, 1)
      : addWeeks(currentDate, 1);
    setCurrentDate(newDate);

    // Update selected date to same day of week in new week
    const newWeekStart = startOfWeek(newDate, { weekStartsOn: 1 });
    const currentDayOffset = selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1;
    const newSelectedDate = new Date(newWeekStart);
    newSelectedDate.setDate(newWeekStart.getDate() + currentDayOffset);
    setSelectedDate(newSelectedDate);
  };

  const handleDayChange = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' ? addDays(selectedDate, -1) : addDays(selectedDate, 1);
    setSelectedDate(newDate);
    onDateChange?.(newDate);
    // Sync currentDate on week boundary (week view) or month boundary (month view)
    const curWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 }).getTime();
    const newWeekStart = startOfWeek(newDate, { weekStartsOn: 1 }).getTime();
    const curMonthStart = startOfMonth(currentDate).getTime();
    const newMonthStart = startOfMonth(newDate).getTime();
    if (curWeekStart !== newWeekStart || curMonthStart !== newMonthStart) setCurrentDate(newDate);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] overflow-x-hidden bg-background">
      {/* Header */}
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        showYearView={showYearView}
        onPrev={handlePrev}
        onNext={handleNext}
        onMonthClick={handleMonthClick}
        onViewChange={setView}
        onTodayClick={handleTodayClick}
      />

      {/* Main content */}
      <div className="flex-1">
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
            selectedDate={selectedDate}
            events={events}
            tasks={tasks}
            notes={calendarNotes}
            getItemColor={getItemColor}
            getNoteColor={getNoteColor}
            onItemClick={handleItemClick}
            onTaskToggle={handleTaskToggle}
            onMonthChange={handleMonthChange}
            onDayChange={handleDayChange}
            onDateSelect={handleDateSelect}
            onCreateFromTimeline={handleCreateFromTimeline}
          />
        ) : (
          <WeekDayView
            currentDate={currentDate}
            selectedDate={selectedDate}
            events={events}
            tasks={tasks}
            notes={calendarNotes}
            getItemColor={getItemColor}
            getNoteColor={getNoteColor}
            onItemClick={handleItemClick}
            onTaskToggle={handleTaskToggle}
            onWeekChange={handleWeekChange}
            onDayChange={handleDayChange}
            onDateSelect={handleDateSelect}
            onCreateFromTimeline={handleCreateFromTimeline}
          />
        )}
      </div>

      {/* Calendar Task Modal */}
      <AddTaskModal
        isOpen={!!editingTask}
        editingTaskId={editingTask?.id}
        defaultDate={selectedDate}
        onClose={() => setEditingTask(null)}
        onOpenInList={() => {
          const task = editingTask;
          setEditingTask(null);
          if (task) onNavigateToTasks?.(task);
        }}
      />

      {/* Timeline create modals */}
      <CreateEventModal
        isOpen={showTimelineCreateEvent}
        onClose={() => { setShowTimelineCreateEvent(false); setTimelineCreateTime(''); }}
        initialDate={selectedDate}
        initialTime={timelineCreateTime}
      />
      <AddTaskModal
        isOpen={showTimelineCreateTask}
        defaultDate={selectedDate}
        defaultTime={timelineCreateTime}
        onClose={() => { setShowTimelineCreateTask(false); setTimelineCreateTime(''); }}
      />
      <CalendarNoteCreateSheet
        isOpen={showTimelineCreateNote}
        date={selectedDate}
        time={timelineCreateTime}
        onClose={() => { setShowTimelineCreateNote(false); setTimelineCreateTime(''); }}
        onOpenInNotes={(note) => {
          setShowTimelineCreateNote(false);
          setTimelineCreateTime('');
          setEditingNote(note);
          setShowNoteEditor(true);
        }}
      />
      <CalendarStickyCreateSheet
        isOpen={showTimelineCreateSticky}
        date={selectedDate}
        time={timelineCreateTime}
        onClose={() => { setShowTimelineCreateSticky(false); setTimelineCreateTime(''); }}
      />

      {/* Edit Modals */}
      <EditEventModal
        event={editingEvent}
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
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
      
      {editingStickyNote && (
        <StickyNoteEditor
          note={editingStickyNote}
          onClose={() => setEditingStickyNote(null)}
        />
      )}
    </div>
  );
}
