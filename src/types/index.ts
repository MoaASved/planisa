export type PastelColor = 
  | 'coral' 
  | 'peach' 
  | 'amber' 
  | 'yellow' 
  | 'mint' 
  | 'teal' 
  | 'sky' 
  | 'lavender' 
  | 'rose' 
  | 'gray';

export type Priority = 'none' | 'low' | 'medium' | 'high';

export type NoteType = 'note' | 'sticky';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  date?: Date;
  time?: string;
  category: string;
  color: PastelColor;
  subtasks: Subtask[];
  notes?: string;
  priority: Priority;
  createdAt: Date;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  category: string;
  color: PastelColor;
  description?: string;
  isAllDay: boolean;
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
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  showInCalendar?: boolean;
  hideFromAllNotes?: boolean;
  hideDate?: boolean;
}

// Separate category types for each section
export interface TaskCategory {
  id: string;
  name: string;
  color: PastelColor;
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
}

// Notebook types
export interface Notebook {
  id: string;
  name: string;
  color: PastelColor;
  createdAt: Date;
}

export interface NotebookPage {
  id: string;
  notebookId: string;
  title: string;
  content: string;
  type: NoteType;
  color?: PastelColor;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  showInCalendar?: boolean;
  hideDate?: boolean;
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
}
