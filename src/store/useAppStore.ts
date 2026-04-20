import { create } from 'zustand';
import { Task, CalendarEvent, Note, Folder, TaskCategory, EventCategory, Widget, UserSettings, Notebook, NotebookPage, TaskSection } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import {
  rowToTask, taskToRow, subtaskToRow,
  rowToTaskCategory, taskCategoryToRow,
  rowToTaskSection, taskSectionToRow,
  rowToEvent, eventToRow,
  rowToEventCategory, eventCategoryToRow,
  rowToNote, noteToRow,
  rowToFolder, folderToRow,
  rowToNotebook, notebookToRow,
  rowToNotebookPage, notebookPageToRow,
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
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;

  // Notebooks
  notebooks: Notebook[];
  addNotebook: (notebook: Omit<Notebook, 'id' | 'createdAt'>) => void;
  updateNotebook: (id: string, updates: Partial<Notebook>) => void;
  deleteNotebook: (id: string) => void;

  // Notebook Pages
  notebookPages: NotebookPage[];
  addNotebookPage: (page: Omit<NotebookPage, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNotebookPage: (id: string, updates: Partial<NotebookPage>) => void;
  deleteNotebookPage: (id: string) => void;

  // Folders
  folders: Folder[];
  addFolder: (folder: Omit<Folder, 'id'>) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;

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
  theme: 'light',
  avatarColor: 'sky',
  avatarInitial: 'U',
  name: '',
};

// Helper: log+swallow Supabase errors so optimistic UI never breaks.
const swallow = (label: string) => (res: any) => {
  if (res?.error) console.error(`[supabase:${label}]`, res.error);
  return res;
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
    notebooks: [],
    notebookPages: [],
    folders: [],
    taskCategories: [],
    taskSections: [],
    eventCategories: [],

    widgets: initialWidgets,
    settings: initialSettings,
    searchQuery: '',
    _userId: null,
    _channels: [],

    // ─────────────────────────── TASKS ───────────────────────────
    addTask: (task) => {
      const id = newId();
      const createdAt = new Date();
      const newTask: Task = { ...task, id, createdAt, subtasks: task.subtasks ?? [] };
      set((s) => ({ tasks: [...s.tasks, newTask] }));
      const userId = uid(); if (!userId) return;
      (supabase.from('tasks') as any).insert(taskToRow({ ...newTask }, userId)).then(swallow('addTask'));
      // persist subtasks if any
      if (newTask.subtasks?.length) {
        const rows = newTask.subtasks.map((s, i) => subtaskToRow(s, id, userId, i));
        (supabase.from('subtasks') as any).insert(rows).then(swallow('addTask.subtasks'));
      }
    },
    updateTask: (id, updates) => {
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)) }));
      const userId = uid(); if (!userId) return;
      const { subtasks, ...rest } = updates as any;
      const row = taskToRow(rest, userId);
      delete row.user_id; // don't change ownership
      (supabase.from('tasks') as any).update(row).eq('id', id).then(swallow('updateTask'));
    },
    deleteTask: (id) => {
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      (supabase.from('tasks') as any).delete().eq('id', id).then(swallow('deleteTask'));
    },
    toggleTask: (id) => {
      const task = get().tasks.find((t) => t.id === id);
      if (!task) return;
      const completed = !task.completed;
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, completed } : t)) }));
      (supabase.from('tasks') as any).update({ completed }).eq('id', id).then(swallow('toggleTask'));
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
      (supabase.from('subtasks') as any).update({ completed }).eq('id', subtaskId).then(swallow('toggleSubtask'));
    },
    hideTask: (id) => {
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, hidden: true } : t)) }));
      (supabase.from('tasks') as any).update({ hidden: true }).eq('id', id).then(swallow('hideTask'));
    },
    unhideTask: (id) => {
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, hidden: false } : t)) }));
      (supabase.from('tasks') as any).update({ hidden: false }).eq('id', id).then(swallow('unhideTask'));
    },
    addSubtask: (taskId, title) => {
      const userId = uid();
      const subId = newId();
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId ? { ...t, subtasks: [...t.subtasks, { id: subId, title, completed: false }] } : t,
        ),
      }));
      if (!userId) return;
      const order = (get().tasks.find((t) => t.id === taskId)?.subtasks.length ?? 1) - 1;
      (supabase.from('subtasks') as any)
        .insert(subtaskToRow({ id: subId, title, completed: false }, taskId, userId, order))
        .then(swallow('addSubtask'));
    },
    removeSubtask: (taskId, subtaskId) => {
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId ? { ...t, subtasks: t.subtasks.filter((x) => x.id !== subtaskId) } : t,
        ),
      }));
      (supabase.from('subtasks') as any).delete().eq('id', subtaskId).then(swallow('removeSubtask'));
    },
    reorderTasks: (orderedIds) => {
      const indexMap = new Map(orderedIds.map((id, i) => [id, i]));
      set((s) => ({
        tasks: s.tasks.map((t) => (indexMap.has(t.id) ? { ...t, order: indexMap.get(t.id)! } : t)),
      }));
      // Persist orders
      orderedIds.forEach((id, i) => {
        (supabase.from('tasks') as any).update({ order_index: i }).eq('id', id).then(swallow('reorderTasks'));
      });
    },

    // ─────────────────────────── EVENTS ───────────────────────────
    addEvent: (event) => {
      const id = newId();
      const newEvent: CalendarEvent = { ...event, id };
      set((s) => ({ events: [...s.events, newEvent] }));
      const userId = uid(); if (!userId) return;
      (supabase.from('events') as any).insert(eventToRow(newEvent, userId)).then(swallow('addEvent'));
    },
    updateEvent: (id, updates) => {
      set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...updates } : e)) }));
      const userId = uid(); if (!userId) return;
      const row = eventToRow(updates, userId); delete row.user_id;
      (supabase.from('events') as any).update(row).eq('id', id).then(swallow('updateEvent'));
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
      const userId = uid(); if (!userId) return;
      (supabase.from('notes') as any).insert(noteToRow(newNote, userId)).then(swallow('addNote'));
    },
    updateNote: (id, updates) => {
      const updatedAt = new Date();
      set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, ...updates, updatedAt } : n)) }));
      const userId = uid(); if (!userId) return;
      const row = noteToRow(updates, userId); delete row.user_id;
      (supabase.from('notes') as any).update(row).eq('id', id).then(swallow('updateNote'));
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
      const userId = uid(); if (!userId) return;
      (supabase.from('note_folders') as any).insert(folderToRow(newF, userId)).then(swallow('addFolder'));
    },
    updateFolder: (id, updates) => {
      set((s) => ({ folders: s.folders.map((f) => (f.id === id ? { ...f, ...updates } : f)) }));
      const userId = uid(); if (!userId) return;
      const row = folderToRow(updates, userId); delete row.user_id;
      (supabase.from('note_folders') as any).update(row).eq('id', id).then(swallow('updateFolder'));
    },
    deleteFolder: (id) => {
      set((s) => ({ folders: s.folders.filter((f) => f.id !== id) }));
      (supabase.from('note_folders') as any).delete().eq('id', id).then(swallow('deleteFolder'));
    },

    // ─────────────────────────── TASK CATEGORIES (lists) ───────────────────────────
    addTaskCategory: (category) => {
      const id = newId();
      const newC: TaskCategory = { ...category, id };
      set((s) => ({ taskCategories: [...s.taskCategories, newC] }));
      const userId = uid(); if (!userId) return;
      (supabase.from('task_lists') as any).insert(taskCategoryToRow(newC, userId)).then(swallow('addTaskCategory'));
    },
    updateTaskCategory: (id, updates) => {
      set((s) => ({ taskCategories: s.taskCategories.map((c) => (c.id === id ? { ...c, ...updates } : c)) }));
      const userId = uid(); if (!userId) return;
      const row = taskCategoryToRow(updates, userId); delete row.user_id;
      (supabase.from('task_lists') as any).update(row).eq('id', id).then(swallow('updateTaskCategory'));
    },
    deleteTaskCategory: (id) => {
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
      const userId = uid(); if (!userId) return;
      (supabase.from('task_sections') as any).insert(taskSectionToRow(newS, userId)).then(swallow('addTaskSection'));
    },
    updateTaskSection: (id, updates) => {
      set((s) => ({ taskSections: s.taskSections.map((x) => (x.id === id ? { ...x, ...updates } : x)) }));
      const userId = uid(); if (!userId) return;
      const row = taskSectionToRow(updates, userId); delete row.user_id;
      (supabase.from('task_sections') as any).update(row).eq('id', id).then(swallow('updateTaskSection'));
    },
    deleteTaskSection: (id) => {
      set((s) => ({
        taskSections: s.taskSections.filter((x) => x.id !== id),
        tasks: s.tasks.map((t) => (t.sectionId === id ? { ...t, sectionId: undefined } : t)),
      }));
      (supabase.from('task_sections') as any).delete().eq('id', id).then(swallow('deleteTaskSection'));
      (supabase.from('tasks') as any).update({ section_id: null }).eq('section_id', id).then(swallow('deleteTaskSection.unset'));
    },

    // ─────────────────────────── EVENT CATEGORIES ───────────────────────────
    addEventCategory: (category) => {
      const id = newId();
      const newC: EventCategory = { ...category, id };
      set((s) => ({ eventCategories: [...s.eventCategories, newC] }));
      const userId = uid(); if (!userId) return;
      (supabase.from('calendar_categories') as any).insert(eventCategoryToRow(newC, userId)).then(swallow('addEventCategory'));
    },
    updateEventCategory: (id, updates) => {
      set((s) => ({ eventCategories: s.eventCategories.map((c) => (c.id === id ? { ...c, ...updates } : c)) }));
      const userId = uid(); if (!userId) return;
      const row = eventCategoryToRow(updates, userId); delete row.user_id;
      (supabase.from('calendar_categories') as any).update(row).eq('id', id).then(swallow('updateEventCategory'));
    },
    deleteEventCategory: (id) => {
      set((s) => ({ eventCategories: s.eventCategories.filter((c) => c.id !== id) }));
      (supabase.from('calendar_categories') as any).delete().eq('id', id).then(swallow('deleteEventCategory'));
    },

    // ─────────────────────────── NOTEBOOKS ───────────────────────────
    addNotebook: (notebook) => {
      const id = newId();
      const newN: Notebook = { ...notebook, id, createdAt: new Date() };
      set((s) => ({ notebooks: [...s.notebooks, newN] }));
      const userId = uid(); if (!userId) return;
      (supabase.from('notebooks') as any).insert(notebookToRow(newN, userId)).then(swallow('addNotebook'));
    },
    updateNotebook: (id, updates) => {
      set((s) => ({ notebooks: s.notebooks.map((n) => (n.id === id ? { ...n, ...updates } : n)) }));
      const userId = uid(); if (!userId) return;
      const row = notebookToRow(updates, userId); delete row.user_id;
      (supabase.from('notebooks') as any).update(row).eq('id', id).then(swallow('updateNotebook'));
    },
    deleteNotebook: (id) => {
      set((s) => ({
        notebooks: s.notebooks.filter((n) => n.id !== id),
        notebookPages: s.notebookPages.filter((p) => p.notebookId !== id),
      }));
      (supabase.from('notebooks') as any).delete().eq('id', id).then(swallow('deleteNotebook'));
    },

    // ─────────────────────────── NOTEBOOK PAGES ───────────────────────────
    addNotebookPage: (page) => {
      const id = newId();
      const now = new Date();
      const newP: NotebookPage = { ...page, id, createdAt: now, updatedAt: now };
      set((s) => ({ notebookPages: [...s.notebookPages, newP] }));
      const userId = uid(); if (!userId) return;
      (supabase.from('notebook_pages') as any).insert(notebookPageToRow(newP, userId)).then(swallow('addNotebookPage'));
    },
    updateNotebookPage: (id, updates) => {
      const updatedAt = new Date();
      set((s) => ({ notebookPages: s.notebookPages.map((p) => (p.id === id ? { ...p, ...updates, updatedAt } : p)) }));
      const userId = uid(); if (!userId) return;
      const row = notebookPageToRow(updates, userId); delete row.user_id;
      (supabase.from('notebook_pages') as any).update(row).eq('id', id).then(swallow('updateNotebookPage'));
    },
    deleteNotebookPage: (id) => {
      set((s) => ({ notebookPages: s.notebookPages.filter((p) => p.id !== id) }));
      (supabase.from('notebook_pages') as any).delete().eq('id', id).then(swallow('deleteNotebookPage'));
    },

    // ─────────────────────────── Client-only ───────────────────────────
    updateWidgets: (widgets) => set({ widgets }),
    updateSettings: (newSettings) => set((s) => ({ settings: { ...s.settings, ...newSettings } })),
    setSearchQuery: (query) => set({ searchQuery: query }),

    // ─────────────────────────── SYNC LIFECYCLE ───────────────────────────
    loadAll: async (userId: string) => {
      set({ _userId: userId });
      const tables = [
        'tasks', 'subtasks', 'task_lists', 'task_sections',
        'events', 'calendar_categories',
        'notes', 'note_folders',
        'notebooks', 'notebook_pages',
      ];
      const results = await Promise.all(
        tables.map((t) => (supabase.from(t as any) as any).select('*').eq('user_id', userId)),
      );
      const [tasksR, subsR, listsR, sectionsR, eventsR, calCatsR, notesR, foldersR, notebooksR, pagesR] = results;
      const subs = subsR.data ?? [];
      set({
        tasks: (tasksR.data ?? []).map((r: any) => rowToTask(r, subs)),
        taskCategories: (listsR.data ?? []).map(rowToTaskCategory),
        taskSections: (sectionsR.data ?? []).map(rowToTaskSection),
        events: (eventsR.data ?? []).map(rowToEvent),
        eventCategories: (calCatsR.data ?? []).map(rowToEventCategory),
        notes: (notesR.data ?? []).map(rowToNote),
        folders: (foldersR.data ?? []).map(rowToFolder),
        notebooks: (notebooksR.data ?? []).map(rowToNotebook),
        notebookPages: (pagesR.data ?? []).map(rowToNotebookPage),
      });
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
        {
          table: 'notebooks',
          apply: (p) => {
            if (p.eventType === 'DELETE') return set((s) => ({ notebooks: s.notebooks.filter((n) => n.id !== p.old.id) }));
            set((s) => ({ notebooks: upsert(s.notebooks, rowToNotebook(p.new)) }));
          },
        },
        {
          table: 'notebook_pages',
          apply: (p) => {
            if (p.eventType === 'DELETE') return set((s) => ({ notebookPages: s.notebookPages.filter((x) => x.id !== p.old.id) }));
            set((s) => ({ notebookPages: upsert(s.notebookPages, rowToNotebookPage(p.new)) }));
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
        notebooks: [],
        notebookPages: [],
        folders: [],
        taskCategories: [],
        taskSections: [],
        eventCategories: [],
      });
    },
  };
});
