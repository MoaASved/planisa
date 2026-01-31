import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import { useHaptics } from './useHaptics';
import { Task, CalendarEvent, Note, NotebookPage } from '@/types';

type DeleteType = 'task' | 'event' | 'note' | 'notebookPage';

type DeleteableItem = Task | CalendarEvent | Note | NotebookPage;

const getDeleteMessage = (type: DeleteType): string => {
  switch (type) {
    case 'task': return 'Uppgift raderad';
    case 'event': return 'Event raderat';
    case 'note': return 'Anteckning raderad';
    case 'notebookPage': return 'Sida raderad';
  }
};

export function useUndoableDelete() {
  const { 
    addTask, deleteTask,
    addEvent, deleteEvent,
    addNote, deleteNote,
    addNotebookPage, deleteNotebookPage 
  } = useAppStore();
  const haptics = useHaptics();

  const deleteWithUndo = (type: DeleteType, item: DeleteableItem) => {
    // Execute delete
    switch (type) {
      case 'task': deleteTask(item.id); break;
      case 'event': deleteEvent(item.id); break;
      case 'note': deleteNote(item.id); break;
      case 'notebookPage': deleteNotebookPage(item.id); break;
    }
    
    haptics.error(); // Haptic for delete
    
    // Show toast with undo button
    toast(getDeleteMessage(type), {
      action: {
        label: 'Ångra',
        onClick: () => restoreItem(type, item)
      },
      duration: 5000,
    });
  };

  const restoreItem = (type: DeleteType, item: DeleteableItem) => {
    switch (type) {
      case 'task': {
        const task = item as Task;
        addTask({
          title: task.title,
          completed: task.completed,
          hidden: task.hidden,
          date: task.date,
          time: task.time,
          endTime: task.endTime,
          category: task.category,
          color: task.color,
          subtasks: task.subtasks,
          notes: task.notes,
          priority: task.priority,
        });
        break;
      }
      case 'event': {
        const event = item as CalendarEvent;
        addEvent({
          title: event.title,
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          category: event.category,
          color: event.color,
          description: event.description,
          isAllDay: event.isAllDay,
        });
        break;
      }
      case 'note': {
        const note = item as Note;
        addNote({
          title: note.title,
          content: note.content,
          type: note.type,
          folder: note.folder,
          tags: note.tags,
          color: note.color,
          date: note.date,
          time: note.time,
          endTime: note.endTime,
          isPinned: note.isPinned,
          showInCalendar: note.showInCalendar,
          hideFromAllNotes: note.hideFromAllNotes,
          hideDate: note.hideDate,
        });
        break;
      }
      case 'notebookPage': {
        const page = item as NotebookPage;
        addNotebookPage({
          notebookId: page.notebookId,
          title: page.title,
          content: page.content,
          type: page.type,
          color: page.color,
          order: page.order,
          showInCalendar: page.showInCalendar,
          hideDate: page.hideDate,
        });
        break;
      }
    }
    haptics.success();
    toast.success('Återställd!');
  };

  return { deleteWithUndo };
}
