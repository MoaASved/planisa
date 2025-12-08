export interface Task {
  id: string;
  title: string;
  completed: boolean;
  date?: Date;
  time?: string;
  category: string;
  color: TaskColor;
  subtasks: Subtask[];
  notes?: string;
  priority: 'low' | 'medium' | 'high';
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
  color: EventColor;
  description?: string;
  isAllDay: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folder: string;
  tags: string[];
  date?: Date;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export type TaskColor = 'coral' | 'mint' | 'lavender' | 'amber' | 'primary';
export type EventColor = 'coral' | 'mint' | 'lavender' | 'amber' | 'primary' | 'rose';

export type CalendarView = 'year' | 'month' | 'week' | 'day';

export interface Widget {
  id: string;
  type: 'mini-calendar' | 'today-tasks' | 'today-events' | 'quick-add' | 'favorite-notes';
  position: { x: number; y: number };
  size: { width: number; height: number };
}
