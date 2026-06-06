export type PastelColor =
  | 'fern'
  | 'pistachio'
  | 'lagune'
  | 'sky'
  | 'honey'
  | 'peach'
  | 'plum'
  | 'peony'
  | 'rose'
  | 'flamingo'
  | 'stone'
  | 'none';

export type Priority = 'none' | 'low' | 'medium' | 'high';

export type NoteType = 'note' | 'sticky';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  hidden?: boolean;
  date?: Date;
  time?: string;
  endTime?: string;
  category: string;
  color: PastelColor;
  subtasks: Subtask[];
  notes?: string;
  note?: string;
  priority: Priority;
  createdAt: Date;
  completedAt?: Date;
  order?: number;
  sectionId?: string;
  listId?: string;
}

export interface TaskSection {
  id: string;
  listId: string;
  name: string;
  order: number;
  collapsed?: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  category: string;
  color?: PastelColor;
  description?: string;
  isAllDay: boolean;
  checklist?: ChecklistItem[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  type: NoteType;
  folder?: string;
  tags: string[];
  color?: PastelColor;
  date?: Date;
  time?: string;
  endTime?: string;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  showInCalendar?: boolean;
  hideFromAllNotes?: boolean;
  hideDate?: boolean;
  position?: number;
}

// Separate category types for each section
export interface TaskCategory {
  id: string;
  name: string;
  color: PastelColor;
  pinned?: boolean;
  sortMode?: 'manual' | 'date' | 'created';
  order?: number;
  showCompleted?: boolean;
  isDefault?: boolean;
}

export interface EventCategory {
  id: string;
  name: string;
  color: PastelColor;
}

export interface Folder {
  id: string;
  name: string;
  color: PastelColor;
  position?: number;
  parentId?: string;
  sortMode?: string;
}

// Legacy Category type for backward compatibility
export interface Category {
  id: string;
  name: string;
  color: PastelColor;
  type: 'task' | 'event' | 'both';
}

export type CalendarView = 'day' | 'week' | 'month' | 'year';

export interface Widget {
  id: string;
  type: 'calendar-week' | 'today-tasks' | 'highlighted-note' | 'image-widget';
  size: 'small' | 'large';
  position: number;
}

export interface UserSettings {
  language: 'en' | 'sv';
  theme: 'light' | 'dark';
  avatar?: string;
  avatarColor?: PastelColor;
  avatarInitial?: string;
  name?: string;
}
