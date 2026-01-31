import { useAppStore } from '@/store/useAppStore';
import { useHaptics } from './useHaptics';
import { Task, CalendarEvent, Note, NotebookPage } from '@/types';

type DeleteType = 'task' | 'event' | 'note' | 'notebookPage';

type DeleteableItem = Task | CalendarEvent | Note | NotebookPage;

export function useUndoableDelete() {
  const { 
    deleteTask,
    deleteEvent,
    deleteNote,
    deleteNotebookPage 
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
  };

  return { deleteWithUndo };
}
