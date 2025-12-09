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
  folder: string;
  tags: string[];
  color: PastelColor;
  date?: Date;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
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
