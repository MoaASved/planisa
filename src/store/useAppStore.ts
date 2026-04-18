import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, CalendarEvent, Note, Folder, TaskCategory, EventCategory, Widget, UserSettings, PastelColor, Notebook, NotebookPage, TaskSection } from '@/types';
import { addDays, startOfToday } from 'date-fns';

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

  // Folders (for Notes - independent)
  folders: Folder[];
  addFolder: (folder: Omit<Folder, 'id'>) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;

  // Task Categories (independent)
  taskCategories: TaskCategory[];
  addTaskCategory: (category: Omit<TaskCategory, 'id'>) => void;
  updateTaskCategory: (id: string, updates: Partial<TaskCategory>) => void;
  deleteTaskCategory: (id: string) => void;
  pinTaskCategory: (id: string) => void;
  unpinTaskCategory: (id: string) => void;
  reorderTaskCategories: (orderedIds: string[]) => void;

  // Task Sections (sub-groupings inside lists)
  taskSections: TaskSection[];
  addTaskSection: (section: Omit<TaskSection, 'id'>) => void;
  updateTaskSection: (id: string, updates: Partial<TaskSection>) => void;
  deleteTaskSection: (id: string) => void;

  // Event Categories (independent)
  eventCategories: EventCategory[];
  addEventCategory: (category: Omit<EventCategory, 'id'>) => void;
  updateEventCategory: (id: string, updates: Partial<EventCategory>) => void;
  deleteEventCategory: (id: string) => void;

  // Widgets
  widgets: Widget[];
  updateWidgets: (widgets: Widget[]) => void;

  // Settings
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const today = startOfToday();

// Initial Task Categories
const initialTaskCategories: TaskCategory[] = [
  { id: 't1', name: 'Work', color: 'sky', sortMode: 'manual', pinned: true },
  { id: 't2', name: 'Personal', color: 'mint', sortMode: 'manual', pinned: true },
  { id: 't3', name: 'Health', color: 'coral', sortMode: 'manual' },
  { id: 't4', name: 'Shopping', color: 'amber', sortMode: 'manual' },
  { id: 't5', name: 'Learning', color: 'lavender', sortMode: 'manual' },
];

// Initial Event Categories
const initialEventCategories: EventCategory[] = [
  { id: 'e1', name: 'Meetings', color: 'sky' },
  { id: 'e2', name: 'Personal', color: 'mint' },
  { id: 'e3', name: 'Social', color: 'rose' },
  { id: 'e4', name: 'Travel', color: 'teal' },
  { id: 'e5', name: 'Deadlines', color: 'coral' },
];

// Initial Folders for Notes
const initialFolders: Folder[] = [
  { id: 'f1', name: 'Work', color: 'sky' },
  { id: 'f2', name: 'Personal', color: 'mint' },
  { id: 'f3', name: 'Ideas', color: 'lavender' },
  { id: 'f4', name: 'Archive', color: 'gray' },
];

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Review project proposal',
    completed: false,
    date: today,
    time: '10:00',
    category: 'Work',
    color: 'sky',
    subtasks: [
      { id: '1a', title: 'Check budget section', completed: true },
      { id: '1b', title: 'Review timeline', completed: false },
    ],
    priority: 'high',
    createdAt: today,
  },
  {
    id: '2',
    title: 'Grocery shopping',
    completed: false,
    date: today,
    category: 'Shopping',
    color: 'amber',
    subtasks: [],
    priority: 'medium',
    createdAt: today,
  },
  {
    id: '3',
    title: 'Morning workout',
    completed: true,
    date: addDays(today, 1),
    category: 'Health',
    color: 'coral',
    subtasks: [],
    priority: 'low',
    createdAt: today,
  },
  {
    id: '4',
    title: 'Prepare presentation',
    completed: false,
    date: addDays(today, 2),
    time: '14:00',
    category: 'Work',
    color: 'sky',
    subtasks: [
      { id: '4a', title: 'Create outline', completed: false },
      { id: '4b', title: 'Design slides', completed: false },
    ],
    priority: 'high',
    createdAt: today,
  },
];

const initialEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Team standup',
    date: today,
    startTime: '09:00',
    endTime: '09:30',
    category: 'Meetings',
    color: 'sky',
    isAllDay: false,
  },
  {
    id: '2',
    title: 'Lunch with Sarah',
    date: today,
    startTime: '12:30',
    endTime: '13:30',
    category: 'Social',
    color: 'rose',
    isAllDay: false,
  },
  {
    id: '3',
    title: 'Product review',
    date: addDays(today, 1),
    startTime: '15:00',
    endTime: '16:00',
    category: 'Meetings',
    color: 'sky',
    isAllDay: false,
  },
];

const initialNotes: Note[] = [
  {
    id: '1',
    title: 'Project Ideas',
    content: '## New App Concepts\n\n- AI-powered task management\n- Smart calendar integration\n- Voice notes feature\n\n### Priority\n1. Focus on UX\n2. Keep it minimal',
    type: 'note',
    folder: 'Ideas',
    tags: [],
    color: 'lavender',
    createdAt: today,
    updatedAt: today,
    isPinned: true,
    showInCalendar: false,
    hideFromAllNotes: false,
  },
  {
    id: '2',
    title: 'Meeting Notes',
    content: '**Attendees:** John, Sarah, Mike\n\n### Key Points\n- Budget approved\n- Launch target: December',
    type: 'note',
    folder: 'Work',
    tags: [],
    color: undefined,
    createdAt: addDays(today, -2),
    updatedAt: addDays(today, -1),
    isPinned: false,
    showInCalendar: true,
    hideFromAllNotes: false,
    date: today,
  },
  {
    id: '3',
    title: 'Book List',
    content: '### Currently Reading\n- Atomic Habits\n\n### Up Next\n- Deep Work\n- The Psychology of Money',
    type: 'note',
    folder: 'Personal',
    tags: [],
    color: 'mint',
    createdAt: addDays(today, -5),
    updatedAt: addDays(today, -3),
    isPinned: false,
    showInCalendar: false,
    hideFromAllNotes: false,
  },
  {
    id: '4',
    title: 'Quick reminder',
    content: 'Remember to call mom!',
    type: 'sticky',
    folder: undefined,
    tags: [],
    color: 'yellow',
    createdAt: today,
    updatedAt: today,
    isPinned: false,
    showInCalendar: false,
    hideFromAllNotes: false,
  },
];

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

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Tasks
      tasks: initialTasks,
      addTask: (task) =>
        set((state) => ({
          tasks: [...state.tasks, { ...task, id: generateId(), createdAt: new Date() }],
        })),
      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),
      toggleTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          ),
        })),
      toggleSubtask: (taskId, subtaskId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks.map((s) =>
                    s.id === subtaskId ? { ...s, completed: !s.completed } : s
                  ),
                }
              : t
          ),
        })),
      hideTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, hidden: true } : t)),
        })),
      unhideTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, hidden: false } : t)),
        })),
      addSubtask: (taskId, title) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: [
                    ...t.subtasks,
                    { id: `sub-${Date.now()}`, title, completed: false },
                  ],
                }
              : t
          ),
        })),
      removeSubtask: (taskId, subtaskId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) }
              : t
          ),
        })),
      reorderTasks: (orderedIds) =>
        set((state) => {
          const indexMap = new Map(orderedIds.map((id, i) => [id, i]));
          return {
            tasks: state.tasks.map((t) =>
              indexMap.has(t.id) ? { ...t, order: indexMap.get(t.id)! } : t,
            ),
          };
        }),

      // Events
      events: initialEvents,
      addEvent: (event) =>
        set((state) => ({
          events: [...state.events, { ...event, id: generateId() }],
        })),
      updateEvent: (id, updates) =>
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),
      deleteEvent: (id) =>
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
        })),

      // Notes
      notes: initialNotes,
      addNote: (note) =>
        set((state) => ({
          notes: [
            ...state.notes,
            { ...note, id: generateId(), createdAt: new Date(), updatedAt: new Date() },
          ],
        })),
      updateNote: (id, updates) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n
          ),
        })),
      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
        })),
      togglePinNote: (id) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, isPinned: !n.isPinned } : n
          ),
        })),

      // Folders (for Notes)
      folders: initialFolders,
      addFolder: (folder) =>
        set((state) => ({
          folders: [...state.folders, { ...folder, id: generateId() }],
        })),
      updateFolder: (id, updates) =>
        set((state) => ({
          folders: state.folders.map((f) => (f.id === id ? { ...f, ...updates } : f)),
        })),
      deleteFolder: (id) =>
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
        })),

      // Task Categories
      taskCategories: initialTaskCategories,
      addTaskCategory: (category) =>
        set((state) => ({
          taskCategories: [...state.taskCategories, { ...category, id: generateId() }],
        })),
      updateTaskCategory: (id, updates) =>
        set((state) => ({
          taskCategories: state.taskCategories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      deleteTaskCategory: (id) =>
        set((state) => ({
          taskCategories: state.taskCategories.filter((c) => c.id !== id),
        })),
      pinTaskCategory: (id) =>
        set((state) => {
          const pinnedCount = state.taskCategories.filter((c) => c.pinned).length;
          if (pinnedCount >= 2) return state;
          return {
            taskCategories: state.taskCategories.map((c) =>
              c.id === id ? { ...c, pinned: true } : c,
            ),
          };
        }),
      unpinTaskCategory: (id) =>
        set((state) => ({
          taskCategories: state.taskCategories.map((c) =>
            c.id === id ? { ...c, pinned: false } : c,
          ),
        })),
      reorderTaskCategories: (orderedIds) =>
        set((state) => {
          const indexMap = new Map(orderedIds.map((id, i) => [id, i]));
          return {
            taskCategories: state.taskCategories.map((c) =>
              indexMap.has(c.id) ? { ...c, order: indexMap.get(c.id)! } : c,
            ),
          };
        }),

      // Task Sections
      taskSections: [] as TaskSection[],
      addTaskSection: (section) =>
        set((state) => ({
          taskSections: [...state.taskSections, { ...section, id: generateId() }],
        })),
      updateTaskSection: (id, updates) =>
        set((state) => ({
          taskSections: state.taskSections.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),
      deleteTaskSection: (id) =>
        set((state) => ({
          taskSections: state.taskSections.filter((s) => s.id !== id),
          tasks: state.tasks.map((t) => (t.sectionId === id ? { ...t, sectionId: undefined } : t)),
        })),

      // Event Categories
      eventCategories: initialEventCategories,
      addEventCategory: (category) =>
        set((state) => ({
          eventCategories: [...state.eventCategories, { ...category, id: generateId() }],
        })),
      updateEventCategory: (id, updates) =>
        set((state) => ({
          eventCategories: state.eventCategories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      deleteEventCategory: (id) =>
        set((state) => ({
          eventCategories: state.eventCategories.filter((c) => c.id !== id),
        })),

      // Notebooks
      notebooks: [] as Notebook[],
      addNotebook: (notebook) =>
        set((state) => ({
          notebooks: [...state.notebooks, { ...notebook, id: generateId(), createdAt: new Date() }],
        })),
      updateNotebook: (id, updates) =>
        set((state) => ({
          notebooks: state.notebooks.map((n) => (n.id === id ? { ...n, ...updates } : n)),
        })),
      deleteNotebook: (id) =>
        set((state) => ({
          notebooks: state.notebooks.filter((n) => n.id !== id),
          // Also delete all pages in this notebook
          notebookPages: state.notebookPages.filter((p) => p.notebookId !== id),
        })),

      // Notebook Pages
      notebookPages: [] as NotebookPage[],
      addNotebookPage: (page) =>
        set((state) => ({
          notebookPages: [...state.notebookPages, { ...page, id: generateId(), createdAt: new Date(), updatedAt: new Date() }],
        })),
      updateNotebookPage: (id, updates) =>
        set((state) => ({
          notebookPages: state.notebookPages.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
          ),
        })),
      deleteNotebookPage: (id) =>
        set((state) => ({
          notebookPages: state.notebookPages.filter((p) => p.id !== id),
        })),

      // Widgets
      widgets: initialWidgets,
      updateWidgets: (widgets) => set({ widgets }),

      // Settings
      settings: initialSettings,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      // Search
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    {
      name: 'flow-planner-storage',
    }
  )
);
