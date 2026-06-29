import { create } from 'zustand';
import { Task, CalendarEvent, Note, Folder, TaskCategory, EventCategory, Widget, UserSettings, TaskSection } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import {
  rowToTask, taskToRow, subtaskToRow,
  rowToTaskCategory, taskCategoryToRow,
  rowToTaskSection, taskSectionToRow,
  rowToEvent, eventToRow,
  rowToEventCategory, eventCategoryToRow,
  rowToNote, noteToRow,
  rowToFolder, folderToRow,
  newId,
} from '@/lib/supabaseSync';

// ──────────────────────────────────────────────────────────────────
// State shape — same public surface as before
// ──────────────────────────────────────────────────────────────────
interface AppState {
  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  reorderTasks: (orderedIds: string[]) => void;
  hideTask: (id: string) => void;
  unhideTask: (id: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  removeSubtask: (taskId: string, subtaskId: string) => void;

  // Events
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;

  // Notes
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateNote: (id: string, updates: Partial<Note>, callbacks?: { onSuccess?: () => void; onError?: (err: any) => void }) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;

  // Folders
  folders: Folder[];
  addFolder: (folder: Omit<Folder, 'id'>) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  reorderFolders: (orderedIds: string[]) => void;
  reorderNotes: (items: Array<{ id: string; type: 'note' | 'folder' }>) => void;
  updateFolderSortMode: (folderId: string, sortMode: string) => void;

  // Task Categories
  taskCategories: TaskCategory[];
  addTaskCategory: (category: Omit<TaskCategory, 'id'>) => void;
  updateTaskCategory: (id: string, updates: Partial<TaskCategory>) => void;
  deleteTaskCategory: (id: string) => void;
  pinTaskCategory: (id: string) => void;
  unpinTaskCategory: (id: string) => void;
  reorderTaskCategories: (orderedIds: string[]) => void;

  // Task Sections
  taskSections: TaskSection[];
  addTaskSection: (section: Omit<TaskSection, 'id'>) => void;
  updateTaskSection: (id: string, updates: Partial<TaskSection>) => void;
  deleteTaskSection: (id: string) => void;
  reorderTaskSections: (orderedIds: string[]) => void;

  // Event Categories
  eventCategories: EventCategory[];
  addEventCategory: (category: Omit<EventCategory, 'id'>) => void;
  updateEventCategory: (id: string, updates: Partial<EventCategory>) => void;
  deleteEventCategory: (id: string) => void;

  // Widgets / Settings / Search (client-only, not synced to DB yet)
  widgets: Widget[];
  updateWidgets: (widgets: Widget[]) => void;
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  highlightTaskId: string | null;
  setHighlightTaskId: (id: string | null) => void;

  // Sync lifecycle
  _userId: string | null;
  _channels: any[];
  loadAll: (userId: string) => Promise<void>;
  subscribeAll: (userId: string) => void;
  reset: () => void;
}

const initialWidgets: Widget[] = [
  { id: '1', type: 'calendar-week', size: 'large', position: 0 },
  { id: '2', type: 'today-tasks', size: 'small', position: 1 },
  { id: '3', type: 'highlighted-note', size: 'small', position: 2 },
];
const initialSettings: UserSettings = {
  language: 'en',
  theme: (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light',
  avatarColor: 'peony',
  avatarInitial: 'U',
  name: '',
};

// Helper: log+swallow Supabase errors so optimistic UI never breaks.
const swallow = (label: string) => (res: any) => {
  if (res?.error) {
    // eslint-disable-next-line no-console
    console.error(`[supabase:${label}]`, res.error.message ?? res.error, res.error);
  }
  return res;
};

// Pending writes queue — flushed when auth/user id becomes available.
const pendingWrites: Array<(uid: string) => void> = [];
const queueOrRun = (storedUserId: string | null, fn: (uid: string) => void) => {
  if (storedUserId) {
    fn(storedUserId);
    return;
  }

  void supabase.auth.getUser().then(({ data, error }) => {
    if (error) {
      console.error('[supabase:auth.getUser]', error.message ?? error, error);
      pendingWrites.push(fn);
      return;
    }

    if (data.user?.id) {
      fn(data.user.id);
      return;
    }

    console.warn('[supabase:queueOrRun] No authenticated user yet, queuing write');
    pendingWrites.push(fn);
  });
};
const flushPending = (uid: string) => {
  while (pendingWrites.length) {
    const fn = pendingWrites.shift()!;
    try { fn(uid); } catch (e) { console.error('[supabase:flushPending]', e); }
  }
};

// Upsert by id helper used after most mutations
const upsert = <T extends { id: string }>(arr: T[], item: T): T[] => {
  const i = arr.findIndex((x) => x.id === item.id);
  if (i === -1) return [...arr, item];
  const copy = arr.slice();
  copy[i] = item;
  return copy;
};

export const useAppStore = create<AppState>()((set, get) => {
  const uid = () => get()._userId;

  return {
    // ──────────────────── State (initially empty) ────────────────────
    tasks: [],
    events: [],
    notes: [],
    folders: [],
    taskCategories: [],
    taskSections: [],
    eventCategories: [],

    widgets: initialWidgets,
    settings: initialSettings,
    searchQuery: '',
    highlightTaskId: null,
    _userId: null,
    _channels: [],

    // ─────────────────────────── TASKS ───────────────────────────
    addTask: (task) => {
      const id = newId();
      const createdAt = new Date();
      const newTask: Task = { ...task, id, createdAt, subtasks: task.subtasks ?? [] };
      set((s) => ({ tasks: [...s.tasks, newTask] }));
      queueOrRun(uid(), (userId) => {
        const payload = taskToRow(newTask, userId);
        (supabase.from('tasks') as any)
          .insert(payload)
          .select()
          .single()
          .then((res: any) => {
            if (res?.error) {
              console.error('[supabase:addTask] insert failed', {
                userId,
                taskId: newTask.id,
                listId: newTask.listId ?? null,
                payload,
                error: res.error,
              });
            }
            return swallow('addTask')(res);
          });
        if (newTask.subtasks?.length) {
          const rows = newTask.subtasks.map((s, i) => subtaskToRow(s, id, userId, i));
          (supabase.from('subtasks') as any).insert(rows).then(swallow('addTask.subtasks'));
        }
      });
    },
    updateTask: (id, updates) => {
      const original = get().tasks.find(t => t.id === id);
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)) }));
      queueOrRun(uid(), (userId) => {
        const { subtasks: newSubs, ...rest } = updates as any;
        const row = taskToRow(rest, userId);
        delete row.user_id;
        (supabase.from('tasks') as any).update(row).eq('id', id).then(swallow('updateTask'));
        if (newSubs !== undefined && original) {
          const origMap = new Map(original.subtasks.map((s: any) => [s.id, s]));
          const newIds = new Set(newSubs.map((s: any) => s.id));
          // Delete removed subtasks
          original.subtasks.forEach((s: any) => {
            if (!newIds.has(s.id))
              (supabase.from('subtasks') as any).delete().eq('id', s.id).then(swallow('updateTask.removeSubtask'));
          });
          newSubs.forEach((s: any, i: number) => {
            if (!origMap.has(s.id)) {
              // Insert new subtasks
              (supabase.from('subtasks') as any)
                .insert(subtaskToRow(s, id, userId, i))
                .then(swallow('updateTask.addSubtask'));
            } else {
              // Update existing subtasks if title or completion changed
              const orig = origMap.get(s.id);
              if (orig.title !== s.title || orig.completed !== s.completed) {
                (supabase.from('subtasks') as any)
                  .update({ title: s.title, completed: s.completed, order_index: i })
                  .eq('id', s.id)
                  .then(swallow('updateTask.updateSubtask'));
              }
            }
          });
        }
      });
    },
    deleteTask: (id) => {
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      queueOrRun(uid(), () => {
        (supabase.from('tasks') as any).delete().eq('id', id).then(swallow('deleteTask'));
      });
    },
    toggleTask: (id) => {
      const task = get().tasks.find((t) => t.id === id);
      if (!task) return;
      const prevCompleted = task.completed;
      const prevCompletedAt = task.completedAt;
      const completed = !prevCompleted;
      const completedAt = completed ? new Date() : undefined;
      // Optimistic update — UI responds immediately
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, completed, completedAt } : t)) }));
      queueOrRun(uid(), async () => {
        // First attempt: include completed_at
        let res = await (supabase.from('tasks') as any)
          .update({ completed, completed_at: completed ? completedAt!.toISOString() : null })
          .eq('id', id);
        // If that failed (e.g. completed_at column not in production), retry with just completed
        if (res.error) {
          res = await (supabase.from('tasks') as any)
            .update({ completed })
            .eq('id', id);
        }
        if (res.error) {
          console.error('[supabase:toggleTask]', res.error.message ?? res.error, res.error);
          // Both attempts failed — revert optimistic update
          set((s) => ({
            tasks: s.tasks.map((t) =>
              t.id === id ? { ...t, completed: prevCompleted, completedAt: prevCompletedAt } : t,
            ),
          }));
        }
      });
    },
    toggleSubtask: (taskId, subtaskId) => {
      const task = get().tasks.find((t) => t.id === taskId);
      const sub = task?.subtasks.find((s) => s.id === subtaskId);
      if (!task || !sub) return;
      const completed = !sub.completed;
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: t.subtasks.map((x) => (x.id === subtaskId ? { ...x, completed } : x)) }
            : t,
        ),
      }));
      queueOrRun(uid(), () => {
        (supabase.from('subtasks') as any).update({ completed }).eq('id', subtaskId).then(swallow('toggleSubtask'));
      });
    },
    hideTask: (id) => {
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, hidden: true } : t)) }));
      queueOrRun(uid(), () => {
        (supabase.from('tasks') as any).update({ hidden: true }).eq('id', id).then(swallow('hideTask'));
      });
    },
    unhideTask: (id) => {
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, hidden: false } : t)) }));
      queueOrRun(uid(), () => {
        (supabase.from('tasks') as any).update({ hidden: false }).eq('id', id).then(swallow('unhideTask'));
      });
    },
    addSubtask: (taskId, title) => {
      const subId = newId();
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId ? { ...t, subtasks: [...t.subtasks, { id: subId, title, completed: false }] } : t,
        ),
      }));
      const order = (get().tasks.find((t) => t.id === taskId)?.subtasks.length ?? 1) - 1;
      queueOrRun(uid(), (userId) => {
        (supabase.from('subtasks') as any)
          .insert(subtaskToRow({ id: subId, title, completed: false }, taskId, userId, order))
          .then(swallow('addSubtask'));
      });
    },
    removeSubtask: (taskId, subtaskId) => {
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId ? { ...t, subtasks: t.subtasks.filter((x) => x.id !== subtaskId) } : t,
        ),
      }));
      queueOrRun(uid(), () => {
        (supabase.from('subtasks') as any).delete().eq('id', subtaskId).then(swallow('removeSubtask'));
      });
    },
    reorderTasks: (orderedIds) => {
      const indexMap = new Map(orderedIds.map((id, i) => [id, i]));
      set((s) => ({
        tasks: s.tasks.map((t) => (indexMap.has(t.id) ? { ...t, order: indexMap.get(t.id)! } : t)),
      }));
      queueOrRun(uid(), () => {
        orderedIds.forEach((id, i) => {
          (supabase.from('tasks') as any).update({ order_index: i }).eq('id', id).then(swallow('reorderTasks'));
        });
      });
    },

    // ─────────────────────────── EVENTS ───────────────────────────
    addEvent: (event) => {
      const id = newId();
      const newEvent: CalendarEvent = { ...event, id };
      set((s) => ({ events: [...s.events, newEvent] }));
      queueOrRun(uid(), (userId) => {
        (supabase.from('events') as any).insert(eventToRow(newEvent, userId)).then(swallow('addEvent'));
      });
    },
    updateEvent: (id, updates) => {
      set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...updates } : e)) }));
      queueOrRun(uid(), (userId) => {
        const row = eventToRow(updates, userId); delete row.user_id;
        (supabase.from('events') as any).update(row).eq('id', id).then(swallow('updateEvent'));
      });
    },
    deleteEvent: (id) => {
      set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
      (supabase.from('events') as any).delete().eq('id', id).then(swallow('deleteEvent'));
    },

    // ─────────────────────────── NOTES ───────────────────────────
    addNote: (note) => {
      const id = newId();
      const now = new Date();
      const newNote: Note = { ...note, id, createdAt: now, updatedAt: now };
      set((s) => ({ notes: [...s.notes, newNote] }));
      queueOrRun(uid(), (userId) => {
        (supabase.from('notes') as any).insert(noteToRow(newNote, userId)).then(swallow('addNote'));
      });
      return id;
    },
    updateNote: (id, updates, callbacks) => {
      const updatedAt = new Date();
      set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, ...updates, updatedAt } : n)) }));
      queueOrRun(uid(), (userId) => {
        const row = noteToRow(updates, userId); delete row.user_id;
        (supabase.from('notes') as any).update(row).eq('id', id).then((res: any) => {
          if (res?.error) {
            console.error('[supabase:updateNote]', res.error.message ?? res.error, res.error);
            callbacks?.onError?.(res.error);
          } else {
            callbacks?.onSuccess?.();
          }
        });
      });
    },
    deleteNote: (id) => {
      set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
      (supabase.from('notes') as any).delete().eq('id', id).then(swallow('deleteNote'));
    },
    togglePinNote: (id) => {
      const note = get().notes.find((n) => n.id === id);
      if (!note) return;
      const isPinned = !note.isPinned;
      set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, isPinned } : n)) }));
      (supabase.from('notes') as any).update({ pinned: isPinned }).eq('id', id).then(swallow('togglePinNote'));
    },

    // ─────────────────────────── FOLDERS ───────────────────────────
    addFolder: (folder) => {
      const id = newId();
      const newF: Folder = { ...folder, id };
      set((s) => ({ folders: [...s.folders, newF] }));
      queueOrRun(uid(), (userId) => {
        (supabase.from('note_folders') as any).insert(folderToRow(newF, userId)).then(swallow('addFolder'));
      });
    },
    updateFolder: (id, updates) => {
      const oldName = get().folders.find((f) => f.id === id)?.name;
      const newName = (updates.name !== undefined && updates.name !== oldName) ? updates.name : null;
      set((s) => ({
        folders: s.folders.map((f) => (f.id === id ? { ...f, ...updates } : f)),
        // Cascade rename to all notes that reference this folder by its old name
        ...(newName && oldName
          ? { notes: s.notes.map((n) => n.folder === oldName ? { ...n, folder: newName } : n) }
          : {}),
      }));
      queueOrRun(uid(), (userId) => {
        const row = folderToRow(updates, userId); delete row.user_id;
        (supabase.from('note_folders') as any).update(row).eq('id', id).then(swallow('updateFolder'));
        if (newName && oldName) {
          (supabase.from('notes') as any)
            .update({ folder_name: newName })
            .eq('folder_name', oldName)
            .eq('user_id', userId)
            .then(swallow('updateFolder:cascade'));
        }
      });
    },
    deleteFolder: (id) => {
      set((s) => ({ folders: s.folders.filter((f) => f.id !== id) }));
      (supabase.from('note_folders') as any).delete().eq('id', id).then(swallow('deleteFolder'));
    },
    reorderFolders: (orderedIds) => {
      const indexMap = new Map(orderedIds.map((id, i) => [id, i]));
      set((s) => ({
        folders: s.folders
          .map((f) => indexMap.has(f.id) ? { ...f, position: indexMap.get(f.id)! } : f)
          .sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity)),
      }));
      orderedIds.forEach((id, i) => {
        (supabase.from('note_folders') as any).update({ position: i }).eq('id', id).then(swallow('reorderFolders'));
      });
    },

    reorderNotes: (items) => {
      const noteMap = new Map<string, number>();
      const folderMap = new Map<string, number>();
      items.forEach(({ id, type }, i) => {
        if (type === 'note') noteMap.set(id, i);
        else folderMap.set(id, i);
      });
      set((s) => ({
        notes: s.notes.map((n) => noteMap.has(n.id) ? { ...n, position: noteMap.get(n.id)! } : n),
        folders: s.folders.map((f) => folderMap.has(f.id) ? { ...f, position: folderMap.get(f.id)! } : f),
      }));
      items.forEach(({ id, type }, i) => {
        if (type === 'note') {
          (supabase.from('notes') as any).update({ position: i }).eq('id', id).then(swallow('reorderNotes'));
        } else {
          (supabase.from('note_folders') as any).update({ position: i }).eq('id', id).then(swallow('reorderFolderItems'));
        }
      });
    },

    updateFolderSortMode: (folderId, sortMode) => {
      set((s) => ({
        folders: s.folders.map((f) => f.id === folderId ? { ...f, sortMode } : f),
      }));
      (supabase.from('note_folders') as any).update({ sort_mode: sortMode }).eq('id', folderId).then(swallow('updateFolderSortMode'));
    },

    // ─────────────────────────── TASK CATEGORIES (lists) ───────────────────────────
    addTaskCategory: (category) => {
      const id = newId();
      const newC: TaskCategory = { ...category, id };
      set((s) => ({ taskCategories: [...s.taskCategories, newC] }));
      queueOrRun(uid(), (userId) => {
        (supabase.from('task_lists') as any).insert(taskCategoryToRow(newC, userId)).then(swallow('addTaskCategory'));
      });
    },
    updateTaskCategory: (id, updates) => {
      set((s) => ({ taskCategories: s.taskCategories.map((c) => (c.id === id ? { ...c, ...updates } : c)) }));
      queueOrRun(uid(), (userId) => {
        const row = taskCategoryToRow(updates, userId); delete row.user_id;
        (supabase.from('task_lists') as any).update(row).eq('id', id).then(swallow('updateTaskCategory'));
      });
    },
    deleteTaskCategory: (id) => {
      if (get().taskCategories.find((c) => c.id === id)?.isDefault) return;
      set((s) => ({ taskCategories: s.taskCategories.filter((c) => c.id !== id) }));
      (supabase.from('task_lists') as any).delete().eq('id', id).then(swallow('deleteTaskCategory'));
    },
    pinTaskCategory: (id) => {
      const pinnedCount = get().taskCategories.filter((c) => c.pinned).length;
      if (pinnedCount >= 2) return;
      set((s) => ({ taskCategories: s.taskCategories.map((c) => (c.id === id ? { ...c, pinned: true } : c)) }));
      (supabase.from('task_lists') as any).update({ pinned: true }).eq('id', id).then(swallow('pinTaskCategory'));
    },
    unpinTaskCategory: (id) => {
      set((s) => ({ taskCategories: s.taskCategories.map((c) => (c.id === id ? { ...c, pinned: false } : c)) }));
      (supabase.from('task_lists') as any).update({ pinned: false }).eq('id', id).then(swallow('unpinTaskCategory'));
    },
    reorderTaskCategories: (orderedIds) => {
      const indexMap = new Map(orderedIds.map((id, i) => [id, i]));
      set((s) => ({
        taskCategories: s.taskCategories.map((c) =>
          indexMap.has(c.id) ? { ...c, order: indexMap.get(c.id)! } : c,
        ),
      }));
      orderedIds.forEach((id, i) => {
        (supabase.from('task_lists') as any).update({ order_index: i }).eq('id', id).then(swallow('reorderTaskCategories'));
      });
    },

    // ─────────────────────────── TASK SECTIONS ───────────────────────────
    addTaskSection: (section) => {
      const id = newId();
      const newS: TaskSection = { ...section, id };
      set((s) => ({ taskSections: [...s.taskSections, newS] }));
      queueOrRun(uid(), (userId) => {
        (supabase.from('task_sections') as any).insert(taskSectionToRow(newS, userId)).then(swallow('addTaskSection'));
      });
    },
    updateTaskSection: (id, updates) => {
      set((s) => ({ taskSections: s.taskSections.map((x) => (x.id === id ? { ...x, ...updates } : x)) }));
      queueOrRun(uid(), (userId) => {
        const row = taskSectionToRow(updates, userId); delete row.user_id;
        (supabase.from('task_sections') as any).update(row).eq('id', id).then(swallow('updateTaskSection'));
      });
    },
    deleteTaskSection: (id) => {
      set((s) => ({
        taskSections: s.taskSections.filter((x) => x.id !== id),
        tasks: s.tasks.map((t) => (t.sectionId === id ? { ...t, sectionId: undefined } : t)),
      }));
      (supabase.from('task_sections') as any).delete().eq('id', id).then(swallow('deleteTaskSection'));
      (supabase.from('tasks') as any).update({ section_id: null }).eq('section_id', id).then(swallow('deleteTaskSection.unset'));
    },
    reorderTaskSections: (orderedIds) => {
      const indexMap = new Map(orderedIds.map((id, i) => [id, i]));
      set((s) => ({
        taskSections: s.taskSections.map((x) => indexMap.has(x.id) ? { ...x, order: indexMap.get(x.id)! } : x),
      }));
      orderedIds.forEach((id, i) => {
        (supabase.from('task_sections') as any).update({ order_index: i }).eq('id', id).then(swallow('reorderTaskSections'));
      });
    },

    // ─────────────────────────── EVENT CATEGORIES ───────────────────────────
    addEventCategory: (category) => {
      const id = newId();
      const newC: EventCategory = { ...category, id };
      set((s) => ({ eventCategories: [...s.eventCategories, newC] }));
      queueOrRun(uid(), (userId) => {
        (supabase.from('calendar_categories') as any).insert(eventCategoryToRow(newC, userId)).then(swallow('addEventCategory'));
      });
    },
    updateEventCategory: (id, updates) => {
      set((s) => ({ eventCategories: s.eventCategories.map((c) => (c.id === id ? { ...c, ...updates } : c)) }));
      queueOrRun(uid(), (userId) => {
        const row = eventCategoryToRow(updates, userId); delete row.user_id;
        (supabase.from('calendar_categories') as any).update(row).eq('id', id).then(swallow('updateEventCategory'));
      });
    },
    deleteEventCategory: (id) => {
      set((s) => ({ eventCategories: s.eventCategories.filter((c) => c.id !== id) }));
      (supabase.from('calendar_categories') as any).delete().eq('id', id).then(swallow('deleteEventCategory'));
    },

    // ─────────────────────────── Client-only ───────────────────────────
    updateWidgets: (widgets) => set({ widgets }),
    updateSettings: (newSettings) => {
      if (newSettings.theme) localStorage.setItem('theme', newSettings.theme);
      set((s) => ({ settings: { ...s.settings, ...newSettings } }));
    },
    setSearchQuery: (query) => set({ searchQuery: query }),
    setHighlightTaskId: (id) => set({ highlightTaskId: id }),

    // ─────────────────────────── SYNC LIFECYCLE ───────────────────────────
    loadAll: async (userId: string) => {
      set({ _userId: userId });
      flushPending(userId);
      const tables = [
        'tasks', 'subtasks', 'task_lists', 'task_sections',
        'events', 'calendar_categories',
        'notes', 'note_folders',
      ];
      const results = await Promise.all(
        tables.map((t) => (supabase.from(t as any) as any).select('*').eq('user_id', userId)),
      );
      const [tasksR, subsR, listsR, sectionsR, eventsR, calCatsR, notesR, foldersR] = results;

      // Log errors but never overwrite a slice with an empty array on failure —
      // that would silently wipe all notes/tasks/events on a transient network error.
      results.forEach((r, i) => {
        if (r.error) console.error(`[supabase:loadAll:${tables[i]}]`, r.error);
      });

      const subs = subsR.data ?? [];
      const update: Record<string, any> = {};
      if (!tasksR.error) update.tasks = (tasksR.data ?? []).map((r: any) => rowToTask(r, subs));
      if (!listsR.error) {
        const categories = (listsR.data ?? []).map(rowToTaskCategory);
        if (!categories.some((c) => c.isDefault)) {
          const defaultList: TaskCategory = {
            id: newId(), name: 'Unsorted', color: 'stone', order: 9999, isDefault: true,
          };
          (supabase.from('task_lists') as any)
            .insert(taskCategoryToRow(defaultList, userId))
            .then(() => {});
          categories.push(defaultList);
        }
        update.taskCategories = categories;
      }
      if (!sectionsR.error) update.taskSections = (sectionsR.data ?? []).map(rowToTaskSection);
      if (!eventsR.error) update.events = (eventsR.data ?? []).map(rowToEvent);
      if (!calCatsR.error) update.eventCategories = (calCatsR.data ?? []).map(rowToEventCategory);
      if (!notesR.error) update.notes = (notesR.data ?? []).map(rowToNote);
      if (!foldersR.error) update.folders = (foldersR.data ?? [])
        .map(rowToFolder)
        .sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));
      set(update);
    },

    subscribeAll: (userId: string) => {
      // tear down old channels
      get()._channels.forEach((ch) => supabase.removeChannel(ch));

      const handlers: Array<{ table: string; apply: (payload: any) => void }> = [
        {
          table: 'tasks',
          apply: (p) => {
            const subs = []; // realtime task updates won't include subtasks; UI state already has them locally
            if (p.eventType === 'DELETE') {
              set((s) => ({ tasks: s.tasks.filter((t) => t.id !== p.old.id) }));
            } else {
              const existing = get().tasks.find((t) => t.id === p.new.id);
              const merged = rowToTask(p.new, []);
              merged.subtasks = existing?.subtasks ?? [];
              set((s) => ({ tasks: upsert(s.tasks, merged) }));
            }
          },
        },
        {
          table: 'subtasks',
          apply: (p) => {
            const taskId = p.new?.task_id ?? p.old?.task_id;
            if (!taskId) return;
            set((s) => ({
              tasks: s.tasks.map((t) => {
                if (t.id !== taskId) return t;
                if (p.eventType === 'DELETE') {
                  return { ...t, subtasks: t.subtasks.filter((x) => x.id !== p.old.id) };
                }
                const sub = { id: p.new.id, title: p.new.title, completed: !!p.new.completed };
                const i = t.subtasks.findIndex((x) => x.id === sub.id);
                const next = i === -1 ? [...t.subtasks, sub] : t.subtasks.map((x, idx) => (idx === i ? sub : x));
                return { ...t, subtasks: next };
              }),
            }));
          },
        },
        {
          table: 'task_lists',
          apply: (p) => {
            if (p.eventType === 'DELETE') return set((s) => ({ taskCategories: s.taskCategories.filter((c) => c.id !== p.old.id) }));
            set((s) => ({ taskCategories: upsert(s.taskCategories, rowToTaskCategory(p.new)) }));
          },
        },
        {
          table: 'task_sections',
          apply: (p) => {
            if (p.eventType === 'DELETE') return set((s) => ({ taskSections: s.taskSections.filter((x) => x.id !== p.old.id) }));
            set((s) => ({ taskSections: upsert(s.taskSections, rowToTaskSection(p.new)) }));
          },
        },
        {
          table: 'events',
          apply: (p) => {
            if (p.eventType === 'DELETE') return set((s) => ({ events: s.events.filter((e) => e.id !== p.old.id) }));
            set((s) => ({ events: upsert(s.events, rowToEvent(p.new)) }));
          },
        },
        {
          table: 'calendar_categories',
          apply: (p) => {
            if (p.eventType === 'DELETE') return set((s) => ({ eventCategories: s.eventCategories.filter((c) => c.id !== p.old.id) }));
            set((s) => ({ eventCategories: upsert(s.eventCategories, rowToEventCategory(p.new)) }));
          },
        },
        {
          table: 'notes',
          apply: (p) => {
            if (p.eventType === 'DELETE') return set((s) => ({ notes: s.notes.filter((n) => n.id !== p.old.id) }));
            set((s) => ({ notes: upsert(s.notes, rowToNote(p.new)) }));
          },
        },
        {
          table: 'note_folders',
          apply: (p) => {
            if (p.eventType === 'DELETE') return set((s) => ({ folders: s.folders.filter((f) => f.id !== p.old.id) }));
            set((s) => ({ folders: upsert(s.folders, rowToFolder(p.new)) }));
          },
        },
      ];

      const channels = handlers.map(({ table, apply }) =>
        supabase
          .channel(`realtime-${table}`)
          .on('postgres_changes' as any,
            { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` },
            apply,
          )
          .subscribe(),
      );

      set({ _channels: channels });
    },

    reset: () => {
      get()._channels.forEach((ch) => supabase.removeChannel(ch));
      set({
        _userId: null,
        _channels: [],
        tasks: [],
        events: [],
        notes: [],
        folders: [],
        taskCategories: [],
        taskSections: [],
        eventCategories: [],
      });
    },
  };
});
