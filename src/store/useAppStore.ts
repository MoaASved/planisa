import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, CalendarEvent, Note, Folder, Category, Widget, UserSettings, PastelColor } from '@/types';
import { addDays, startOfToday } from 'date-fns';

interface AppState {
  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;

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

  // Folders
  folders: Folder[];
  addFolder: (folder: Omit<Folder, 'id'>) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;

  // Categories
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

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

const initialCategories: Category[] = [
  { id: '1', name: 'Work', color: 'sky', type: 'both' },
  { id: '2', name: 'Personal', color: 'mint', type: 'both' },
  { id: '3', name: 'Health', color: 'coral', type: 'both' },
  { id: '4', name: 'Finance', color: 'amber', type: 'both' },
  { id: '5', name: 'Social', color: 'lavender', type: 'both' },
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
    category: 'Personal',
    color: 'mint',
    subtasks: [],
    priority: 'medium',
    createdAt: today,
  },
  {
    id: '3',
    title: 'Call dentist',
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
    color: 'lavender',
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
    category: 'Work',
    color: 'sky',
    isAllDay: false,
  },
  {
    id: '2',
    title: 'Lunch with Sarah',
    date: today,
    startTime: '12:30',
    endTime: '13:30',
    category: 'Personal',
    color: 'mint',
    isAllDay: false,
  },
  {
    id: '3',
    title: 'Product review',
    date: addDays(today, 1),
    startTime: '15:00',
    endTime: '16:00',
    category: 'Work',
    color: 'lavender',
    isAllDay: false,
  },
];

const initialNotes: Note[] = [
  {
    id: '1',
    title: 'Project Ideas',
    content: '## New App Concepts\n\n- AI-powered task management\n- Smart calendar integration\n- Voice notes feature\n\n### Priority\n1. Focus on UX\n2. Keep it minimal',
    folder: 'Work',
    tags: ['ideas', 'projects'],
    color: 'sky',
    createdAt: today,
    updatedAt: today,
    isPinned: true,
  },
  {
    id: '2',
    title: 'Meeting Notes',
    content: '**Attendees:** John, Sarah, Mike\n\n### Key Points\n- Budget approved\n- Launch target: December',
    folder: 'Work',
    tags: ['meetings'],
    color: 'lavender',
    createdAt: addDays(today, -2),
    updatedAt: addDays(today, -1),
    isPinned: false,
  },
  {
    id: '3',
    title: 'Book List',
    content: '### Currently Reading\n- Atomic Habits\n\n### Up Next\n- Deep Work\n- The Psychology of Money',
    folder: 'Personal',
    tags: ['books'],
    color: 'mint',
    createdAt: addDays(today, -5),
    updatedAt: addDays(today, -3),
    isPinned: false,
  },
];

const initialFolders: Folder[] = [
  { id: '1', name: 'Work', color: 'sky' },
  { id: '2', name: 'Personal', color: 'mint' },
  { id: '3', name: 'Ideas', color: 'lavender' },
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

      // Folders
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

      // Categories
      categories: initialCategories,
      addCategory: (category) =>
        set((state) => ({
          categories: [...state.categories, { ...category, id: generateId() }],
        })),
      updateCategory: (id, updates) =>
        set((state) => ({
          categories: state.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
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