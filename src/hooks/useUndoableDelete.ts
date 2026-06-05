import { useAppStore } from '@/store/useAppStore';
import { useHaptics } from './useHaptics';
import { Task, CalendarEvent, Note } from '@/types';

type DeleteType = 'task' | 'event' | 'note';

type DeleteableItem = Task | CalendarEvent | Note;

export function useUndoableDelete() {
  const {
    deleteTask,
    deleteEvent,
    deleteNote,
  } = useAppStore();
  const haptics = useHaptics();

  const deleteWithUndo = (type: DeleteType, item: DeleteableItem) => {
    switch (type) {
      case 'task': deleteTask(item.id); break;
      case 'event': deleteEvent(item.id); break;
      case 'note': deleteNote(item.id); break;
    }

    haptics.error();
  };

  return { deleteWithUndo };
}
