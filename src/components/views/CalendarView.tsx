import { useState, useRef } from 'react';
import { addMonths, subMonths, addWeeks, subWeeks, addDays, startOfWeek, startOfMonth } from 'date-fns';
import { useAppStore } from '@/store/useAppStore';
import { PastelColor, Task, CalendarEvent, Note } from '@/types';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { YearView, YearViewHandle } from '@/components/calendar/YearView';
import { MonthView } from '@/components/calendar/MonthView';
import { WeekDayView } from '@/components/calendar/WeekDayView';
import { DesktopWeekGrid } from '@/components/calendar/DesktopWeekGrid';
import { DesktopListView } from '@/components/calendar/DesktopListView';
import { EditEventModal } from '@/components/modals/EditEventModal';
import { CreateEventModal } from '@/components/modals/CreateEventModal';
import { CalendarNoteModal } from '@/components/modals/CalendarNoteModal';
import { ClearedTaskPreviewModal } from '@/components/modals/ClearedTaskPreviewModal';
import { CalendarNoteCreateSheet } from '@/components/modals/CalendarNoteCreateSheet';
import { AddTaskModal } from '@/components/tasks/AddTaskModal';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { StickyNoteEditor } from '@/components/notes/StickyNoteEditor';

type SimpleView = 'month' | 'weekday';
type DesktopView = 'day' | 'week' | 'month' | 'year';

export function CalendarViewComponent({ onDateChange, onNavigateToTasks }: { onDateChange?: (date: Date) => void; onNavigateToTasks?: (task: Task) => void }) {
  const yearViewRef = useRef<YearViewHandle>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<SimpleView>('month');
  const [showYearView, setShowYearView] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);
  const [desktopListMode, setDesktopListMode] = useState(false);

  // Desktop view defaults to 'week' on wide screens, 'month' on narrow (matches mobile default)
  const [desktopView, setDesktopView] = useState<DesktopView>(() =>
    typeof window !== 'undefined' && window.innerWidth >= 768 ? 'week' : 'month'
  );

  const { events, tasks, notes, toggleTask, taskCategories, eventCategories, folders } = useAppStore();

  // Edit modal states
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [duplicatingEvent, setDuplicatingEvent] = useState<CalendarEvent | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [clearedTaskPreview, setClearedTaskPreview] = useState<Task | null>(null);
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
  const calendarNotes: Note[] = notes.filter(n => n.showInCalendar);

  // Week days for the desktop week/day grid
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getItemColor = (item: Task | CalendarEvent, type: 'task' | 'event'): PastelColor => {
    if (type === 'task') {
      const task = item as Task;
      const category = task.listId
        ? taskCategories.find(c => c.id === task.listId)
        : taskCategories.find(c => c.name === task.category);
      return category?.color || item.color || 'peony';
    } else {
      const event = item as CalendarEvent;
      const category = eventCategories.find(c => c.name === event.category);
      return item.color || category?.color || 'peony';
    }
  };

  const getNoteColor = (note: Note): PastelColor => {
    if (note.color) return note.color;
    const folder = folders.find(f => f.name === note.folder);
    return folder?.color || 'peony';
  };

  const handlePrev = () => {
    if (desktopView === 'day') {
      const d = addDays(currentDate, -1);
      setCurrentDate(d);
      setSelectedDate(d);
    } else if (desktopView === 'year') {
      setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
    } else if (desktopView === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (desktopView === 'day') {
      const d = addDays(currentDate, 1);
      setCurrentDate(d);
      setSelectedDate(d);
    } else if (desktopView === 'year') {
      setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));
    } else if (desktopView === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  // Mobile-only: toggle year overlay
  const handleMonthClick = () => {
    setShowYearView(!showYearView);
  };

  // Mobile year overlay: selecting a month closes the overlay
  const handleYearMonthSelect = (date: Date) => {
    setCurrentDate(date);
    setSelectedDate(date);
    setShowYearView(false);
  };

  // Desktop year view: selecting a month switches to month view
  const handleYearMonthSelectDesktop = (date: Date) => {
    setCurrentDate(date);
    setSelectedDate(date);
    setDesktopView('month');
    setView('month');
  };

  const handleDesktopViewChange = (v: DesktopView) => {
    if (v === 'week' || v === 'day') setCurrentDate(selectedDate);
    setDesktopView(v);
    if (v === 'month') setView('month');
    else if (v === 'week' || v === 'day') setView('weekday');
  };

  // Mobile icon buttons: sync desktopView so prev/next navigation stays correct
  const handleViewChange = (v: SimpleView) => {
    if (v === 'weekday') setCurrentDate(selectedDate);
    setView(v);
    setDesktopView(v === 'month' ? 'month' : 'week');
  };

  const handleTodayClick = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
    if (desktopView === 'year') {
      yearViewRef.current?.scrollToToday();
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onDateChange?.(date);
  };

  const handleDesktopDayHeaderClick = (date: Date) => {
    setSelectedDate(date);
    setCurrentDate(date);
    setDesktopView('day');
    setView('weekday');
    onDateChange?.(date);
  };

  const handleItemClick = (item: Task | CalendarEvent | Note, type: 'task' | 'event' | 'note') => {
    if (type === 'event') {
      setEditingEvent(item as CalendarEvent);
    } else if (type === 'task') {
      const task = item as Task;
      if (task.hidden && task.completed) {
        setClearedTaskPreview(task);
      } else {
        setEditingTask(task);
      }
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
    const task = tasks.find(t => t.id === taskId);
    if (task?.hidden) return;
    toggleTask(taskId);
  };

  const handleCreateFromTimeline = (type: 'event' | 'task' | 'note' | 'sticky', time: string, date?: Date) => {
    setTimelineCreateTime(time);
    if (date) {
      setSelectedDate(date);
      onDateChange?.(date);
    }
    if (type === 'event') setShowTimelineCreateEvent(true);
    else if (type === 'task') setShowTimelineCreateTask(true);
    else if (type === 'note') setShowTimelineCreateNote(true);
    else if (type === 'sticky') setShowTimelineCreateSticky(true);
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
  };

  const handleWeekChange = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1);
    setCurrentDate(newDate);
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
    const curWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 }).getTime();
    const newWeekStart = startOfWeek(newDate, { weekStartsOn: 1 }).getTime();
    const curMonthStart = startOfMonth(currentDate).getTime();
    const newMonthStart = startOfMonth(newDate).getTime();
    if (curWeekStart !== newWeekStart || curMonthStart !== newMonthStart) setCurrentDate(newDate);
  };

  const handleDuplicateEvent = (event: CalendarEvent) => {
    setEditingEvent(null);
    setDuplicatingEvent(event);
  };

  const sharedGridProps = {
    events,
    tasks,
    notes: calendarNotes,
    selectedDate,
    onDateSelect: handleDateSelect,
    getItemColor,
    getNoteColor,
    onItemClick: handleItemClick,
    onTaskToggle: handleTaskToggle,
    onCreateFromTimeline: handleCreateFromTimeline,
    onDuplicateEvent: handleDuplicateEvent,
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-100px)] md:h-dvh overflow-hidden bg-white md:bg-background dark:bg-[#1C1A18]">
      {/* Header */}
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        showYearView={showYearView}
        onPrev={handlePrev}
        onNext={handleNext}
        onMonthClick={handleMonthClick}
        onViewChange={handleViewChange}
        onTodayClick={handleTodayClick}
        desktopView={desktopView}
        onDesktopViewChange={handleDesktopViewChange}
        isListMode={desktopListMode}
        onListModeToggle={() => setDesktopListMode(m => !m)}
      />

      {/* Mobile content — unchanged */}
      <div className="md:hidden flex-1 overflow-hidden">
        {showYearView ? (
          <YearView currentDate={currentDate} onMonthClick={handleYearMonthSelect} />
        ) : view === 'month' ? (
          <MonthView
            currentDate={currentDate}
            selectedDate={selectedDate}
            events={events}
            tasks={tasks}
            notes={calendarNotes}
            allNotes={notes}
            getItemColor={getItemColor}
            getNoteColor={getNoteColor}
            onItemClick={handleItemClick}
            onTaskToggle={handleTaskToggle}
            onMonthChange={handleMonthChange}
            onDayChange={handleDayChange}
            onDateSelect={handleDateSelect}
            onCreateFromTimeline={handleCreateFromTimeline}
            showTimeline={showTimeline}
            onTimelineChange={setShowTimeline}
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
            showTimeline={showTimeline}
            onTimelineChange={setShowTimeline}
          />
        )}
      </div>

      {/* Desktop content — driven by desktopView */}
      <div className="hidden md:flex flex-col flex-1 min-h-0 px-4 pb-4 pt-1">
        <div className="flex flex-col flex-1 min-h-0 rounded-2xl overflow-hidden bg-white dark:bg-[#1C1C1E] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.07),0_16px_40px_-8px_rgba(0,0,0,0.12)] border border-black/[0.04] dark:border-white/[0.05]">
          {desktopView === 'year' && (
            <YearView ref={yearViewRef} currentDate={currentDate} onMonthClick={handleYearMonthSelectDesktop} />
          )}
          {desktopView === 'month' && (
            <MonthView
              currentDate={currentDate}
              selectedDate={selectedDate}
              events={events}
              tasks={tasks}
              notes={calendarNotes}
              allNotes={notes}
              getItemColor={getItemColor}
              getNoteColor={getNoteColor}
              onItemClick={handleItemClick}
              onTaskToggle={handleTaskToggle}
              onMonthChange={handleMonthChange}
              onDayChange={handleDayChange}
              onDateSelect={handleDateSelect}
              onCreateFromTimeline={handleCreateFromTimeline}
              showTimeline={showTimeline}
              onTimelineChange={setShowTimeline}
              onDesktopDayClick={(day) => { setCurrentDate(day); handleDesktopViewChange('week'); }}
            />
          )}
          {desktopView === 'week' && (desktopListMode
            ? <DesktopListView weekDays={weekDays} events={events} tasks={tasks} notes={calendarNotes} getItemColor={getItemColor} getNoteColor={getNoteColor} onItemClick={handleItemClick} onTaskToggle={handleTaskToggle} />
            : <DesktopWeekGrid weekDays={weekDays} {...sharedGridProps} onDayHeaderClick={handleDesktopDayHeaderClick} />
          )}
          {desktopView === 'day' && (desktopListMode
            ? <DesktopListView weekDays={[selectedDate]} events={events} tasks={tasks} notes={calendarNotes} getItemColor={getItemColor} getNoteColor={getNoteColor} onItemClick={handleItemClick} onTaskToggle={handleTaskToggle} />
            : <DesktopWeekGrid weekDays={[selectedDate]} {...sharedGridProps} />
          )}
        </div>
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

      {/* Read-only preview for tasks cleared from the task list */}
      <ClearedTaskPreviewModal
        task={clearedTaskPreview}
        isOpen={!!clearedTaskPreview}
        onClose={() => setClearedTaskPreview(null)}
      />

      {/* Duplicate event — opens CreateEventModal pre-filled with the source event */}
      <CreateEventModal
        isOpen={!!duplicatingEvent}
        onClose={() => setDuplicatingEvent(null)}
        prefill={duplicatingEvent ?? undefined}
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
      {showTimelineCreateSticky && (
        <StickyNoteEditor
          onClose={() => { setShowTimelineCreateSticky(false); setTimelineCreateTime(''); }}
          initialDate={selectedDate}
          initialTime={timelineCreateTime}
        />
      )}

      {/* Edit Modals */}
      <EditEventModal
        event={editingEvent}
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        onDuplicate={editingEvent ? () => handleDuplicateEvent(editingEvent) : undefined}
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
