import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, CalendarEvent, Note, Folder, Widget } from '@/types';
import { addDays, startOfToday, addHours } from 'date-fns';

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
  deleteFolder: (id: string) => void;

  // Widgets
  widgets: Widget[];
  updateWidgetPosition: (id: string, position: { x: number; y: number }) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const today = startOfToday();

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Review project proposal',
    completed: false,
    date: today,
    time: '10:00',
    category: 'Work',
    color: 'primary',
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
    title: 'Call dentist for appointment',
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
    title: 'Prepare presentation slides',
    completed: false,
    date: addDays(today, 2),
    time: '14:00',
    category: 'Work',
    color: 'lavender',
    subtasks: [
      { id: '4a', title: 'Create outline', completed: false },
      { id: '4b', title: 'Design slides', completed: false },
      { id: '4c', title: 'Add animations', completed: false },
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
    color: 'primary',
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
    title: 'Product review meeting',
    date: addDays(today, 1),
    startTime: '15:00',
    endTime: '16:00',
    category: 'Work',
    color: 'lavender',
    isAllDay: false,
  },
  {
    id: '4',
    title: 'Weekend trip',
    date: addDays(today, 5),
    category: 'Personal',
    color: 'coral',
    isAllDay: true,
  },
];

const initialNotes: Note[] = [
  {
    id: '1',
    title: 'Project Ideas',
    content: '## New App Concepts\n\n- AI-powered task management\n- Smart calendar integration\n- Voice notes feature\n\n### Priority\n1. Focus on UX\n2. Keep it minimal\n3. Fast performance',
    folder: 'Work',
    tags: ['ideas', 'projects'],
    createdAt: today,
    updatedAt: today,
    isPinned: true,
  },
  {
    id: '2',
    title: 'Meeting Notes - Q4 Planning',
    content: '**Attendees:** John, Sarah, Mike\n\n### Key Points\n- Budget approved for new features\n- Launch target: December\n- [ ] Follow up with design team\n- [x] Schedule review meeting',
    folder: 'Work',
    tags: ['meetings', 'planning'],
    createdAt: addDays(today, -2),
    updatedAt: addDays(today, -1),
    isPinned: false,
  },
  {
    id: '3',
    title: 'Book Recommendations',
    content: '### Currently Reading\n- Atomic Habits by James Clear\n\n### Up Next\n- Deep Work\n- The Psychology of Money',
    folder: 'Personal',
    tags: ['books', 'reading'],
    createdAt: addDays(today, -5),
    updatedAt: addDays(today, -3),
    isPinned: false,
  },
];

const initialFolders: Folder[] = [
  { id: '1', name: 'Work', color: 'primary' },
  { id: '2', name: 'Personal', color: 'mint' },
  { id: '3', name: 'Ideas', color: 'lavender' },
];

const initialWidgets: Widget[] = [
  { id: '1', type: 'mini-calendar', position: { x: 0, y: 0 }, size: { width: 1, height: 1 } },
  { id: '2', type: 'today-tasks', position: { x: 1, y: 0 }, size: { width: 1, height: 1 } },
  { id: '3', type: 'today-events', position: { x: 0, y: 1 }, size: { width: 1, height: 1 } },
  { id: '4', type: 'quick-add', position: { x: 1, y: 1 }, size: { width: 1, height: 1 } },
];

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
      deleteFolder: (id) =>
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
        })),

      // Widgets
      widgets: initialWidgets,
      updateWidgetPosition: (id, position) =>
        set((state) => ({
          widgets: state.widgets.map((w) => (w.id === id ? { ...w, position } : w)),
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
