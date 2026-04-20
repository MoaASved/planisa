import { Task, CalendarEvent, Note, Folder, TaskCategory, EventCategory, Notebook, NotebookPage, TaskSection, Subtask, PastelColor, Priority, NoteType } from '@/types';

// ──────────────────────────────────────────────────────────────────
// DB row types (loose — we only type the fields we touch)
// ──────────────────────────────────────────────────────────────────
type Row = Record<string, any>;

const asColor = (v: any): PastelColor | undefined =>
  v ? (v as PastelColor) : undefined;

const asDate = (v: any): Date | undefined =>
  v ? new Date(v) : undefined;

// ────────────── TASKS ──────────────
export function rowToTask(row: Row, subtaskRows: Row[] = []): Task {
  return {
    id: row.id,
    title: row.title,
    completed: !!row.completed,
    hidden: !!row.hidden,
    date: asDate(row.due_date),
    time: row.time_text ?? undefined,
    endTime: row.end_time_text ?? undefined,
    category: row.category_name ?? '',
    color: (asColor(row.color) ?? 'sky') as PastelColor,
    subtasks: subtaskRows
      .filter((s) => s.task_id === row.id)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      .map((s) => ({ id: s.id, title: s.title, completed: !!s.completed })),
    notes: row.note ?? undefined,
    note: row.note ?? undefined,
    priority: (row.priority ?? 'none') as Priority,
    createdAt: new Date(row.created_at),
    order: row.order_index ?? undefined,
    sectionId: row.section_id ?? undefined,
    listId: row.list_id ?? undefined,
  };
}

export function taskToRow(task: Partial<Task>, userId: string): Row {
  const r: Row = { user_id: userId };
  if (task.id !== undefined) r.id = task.id;
  if (task.title !== undefined) r.title = task.title;
  if (task.completed !== undefined) r.completed = task.completed;
  if (task.hidden !== undefined) r.hidden = task.hidden;
  if (task.date !== undefined) r.due_date = task.date ? new Date(task.date).toISOString() : null;
  if (task.time !== undefined) r.time_text = task.time ?? null;
  if (task.endTime !== undefined) r.end_time_text = task.endTime ?? null;
  if (task.category !== undefined) r.category_name = task.category ?? null;
  if (task.color !== undefined) r.color = task.color ?? null;
  if (task.note !== undefined) r.note = task.note ?? null;
  if (task.notes !== undefined && task.note === undefined) r.note = task.notes ?? null;
  if (task.priority !== undefined) r.priority = task.priority;
  if (task.order !== undefined) r.order_index = task.order;
  if (task.sectionId !== undefined) r.section_id = task.sectionId ?? null;
  if (task.listId !== undefined) r.list_id = task.listId ?? null;
  return r;
}

// ────────────── SUBTASKS ──────────────
export function subtaskToRow(s: Subtask, taskId: string, userId: string, orderIndex = 0): Row {
  return {
    id: s.id,
    task_id: taskId,
    user_id: userId,
    title: s.title,
    completed: s.completed,
    order_index: orderIndex,
  };
}

// ────────────── TASK LISTS ──────────────
export function rowToTaskCategory(row: Row): TaskCategory {
  return {
    id: row.id,
    name: row.title,
    color: (asColor(row.color) ?? 'sky') as PastelColor,
    pinned: !!row.pinned,
    sortMode: (row.sort_mode ?? 'manual') as TaskCategory['sortMode'],
    order: row.order_index ?? 0,
  };
}
export function taskCategoryToRow(c: Partial<TaskCategory>, userId: string): Row {
  const r: Row = { user_id: userId };
  if (c.id !== undefined) r.id = c.id;
  if (c.name !== undefined) r.title = c.name;
  if (c.color !== undefined) r.color = c.color;
  if (c.pinned !== undefined) r.pinned = c.pinned;
  if (c.sortMode !== undefined) r.sort_mode = c.sortMode;
  if (c.order !== undefined) r.order_index = c.order;
  return r;
}

// ────────────── TASK SECTIONS ──────────────
export function rowToTaskSection(row: Row): TaskSection {
  return {
    id: row.id,
    listId: row.list_id ?? '',
    name: row.name,
    order: row.order_index ?? 0,
    collapsed: !!row.collapsed,
  };
}
export function taskSectionToRow(s: Partial<TaskSection>, userId: string): Row {
  const r: Row = { user_id: userId };
  if (s.id !== undefined) r.id = s.id;
  if (s.listId !== undefined) r.list_id = s.listId || null;
  if (s.name !== undefined) r.name = s.name;
  if (s.order !== undefined) r.order_index = s.order;
  if (s.collapsed !== undefined) r.collapsed = s.collapsed;
  return r;
}

// ────────────── EVENTS ──────────────
export function rowToEvent(row: Row): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    date: row.event_date ? new Date(row.event_date) : new Date(row.created_at),
    startTime: row.time_text ?? undefined,
    endTime: row.end_time_text ?? undefined,
    category: row.category_name ?? '',
    color: (asColor(row.color) ?? 'sky') as PastelColor,
    description: row.description ?? undefined,
    isAllDay: !!row.all_day,
  };
}
export function eventToRow(e: Partial<CalendarEvent>, userId: string): Row {
  const r: Row = { user_id: userId };
  if (e.id !== undefined) r.id = e.id;
  if (e.title !== undefined) r.title = e.title;
  if (e.date !== undefined) {
    const d = new Date(e.date);
    // store as date-only (YYYY-MM-DD)
    r.event_date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  if (e.startTime !== undefined) r.time_text = e.startTime ?? null;
  if (e.endTime !== undefined) r.end_time_text = e.endTime ?? null;
  if (e.category !== undefined) r.category_name = e.category ?? null;
  if (e.color !== undefined) r.color = e.color ?? null;
  if (e.description !== undefined) r.description = e.description ?? null;
  if (e.isAllDay !== undefined) r.all_day = e.isAllDay;
  return r;
}

// ────────────── EVENT CATEGORIES (calendar_categories) ──────────────
export function rowToEventCategory(row: Row): EventCategory {
  return {
    id: row.id,
    name: row.title,
    color: (asColor(row.color) ?? 'sky') as PastelColor,
  };
}
export function eventCategoryToRow(c: Partial<EventCategory>, userId: string): Row {
  const r: Row = { user_id: userId };
  if (c.id !== undefined) r.id = c.id;
  if (c.name !== undefined) r.title = c.name;
  if (c.color !== undefined) r.color = c.color;
  return r;
}

// ────────────── NOTES ──────────────
export function rowToNote(row: Row): Note {
  return {
    id: row.id,
    title: row.title ?? '',
    content: row.content ?? '',
    type: (row.is_sticky ? 'sticky' : 'note') as NoteType,
    folder: row.folder_name ?? undefined,
    tags: row.tags ?? [],
    color: asColor(row.color),
    date: asDate(row.event_date),
    time: row.time_text ?? undefined,
    endTime: row.end_time_text ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    isPinned: !!row.pinned,
    showInCalendar: !!row.show_in_calendar,
    hideFromAllNotes: !!row.hide_from_all_notes,
    hideDate: !!row.hide_date,
  };
}
export function noteToRow(n: Partial<Note>, userId: string): Row {
  const r: Row = { user_id: userId };
  if (n.id !== undefined) r.id = n.id;
  if (n.title !== undefined) r.title = n.title;
  if (n.content !== undefined) r.content = n.content;
  if (n.type !== undefined) r.is_sticky = n.type === 'sticky';
  if (n.folder !== undefined) r.folder_name = n.folder ?? null;
  if (n.tags !== undefined) r.tags = n.tags;
  if (n.color !== undefined) r.color = n.color ?? null;
  if (n.date !== undefined) r.event_date = n.date ? new Date(n.date).toISOString() : null;
  if (n.time !== undefined) r.time_text = n.time ?? null;
  if (n.endTime !== undefined) r.end_time_text = n.endTime ?? null;
  if (n.isPinned !== undefined) r.pinned = n.isPinned;
  if (n.showInCalendar !== undefined) r.show_in_calendar = n.showInCalendar;
  if (n.hideFromAllNotes !== undefined) r.hide_from_all_notes = n.hideFromAllNotes;
  if (n.hideDate !== undefined) r.hide_date = n.hideDate;
  return r;
}

// ────────────── FOLDERS (note_folders) ──────────────
export function rowToFolder(row: Row): Folder {
  return {
    id: row.id,
    name: row.title,
    color: (asColor(row.color) ?? 'sky') as PastelColor,
  };
}
export function folderToRow(f: Partial<Folder>, userId: string): Row {
  const r: Row = { user_id: userId };
  if (f.id !== undefined) r.id = f.id;
  if (f.name !== undefined) r.title = f.name;
  if (f.color !== undefined) r.color = f.color;
  return r;
}

// ────────────── NOTEBOOKS ──────────────
export function rowToNotebook(row: Row): Notebook {
  return {
    id: row.id,
    name: row.title,
    color: (asColor(row.color) ?? 'sky') as PastelColor,
    createdAt: new Date(row.created_at),
  };
}
export function notebookToRow(n: Partial<Notebook>, userId: string): Row {
  const r: Row = { user_id: userId };
  if (n.id !== undefined) r.id = n.id;
  if (n.name !== undefined) r.title = n.name;
  if (n.color !== undefined) r.color = n.color;
  return r;
}

// ────────────── NOTEBOOK PAGES ──────────────
export function rowToNotebookPage(row: Row): NotebookPage {
  return {
    id: row.id,
    notebookId: row.notebook_id,
    title: row.title ?? '',
    content: row.content ?? '',
    type: (row.note_type ?? 'note') as NoteType,
    color: asColor(row.color),
    order: row.order_index ?? 0,
    date: asDate(row.event_date),
    time: row.time_text ?? undefined,
    endTime: row.end_time_text ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    showInCalendar: !!row.show_in_calendar,
    hideDate: !!row.hide_date,
  };
}
export function notebookPageToRow(p: Partial<NotebookPage>, userId: string): Row {
  const r: Row = { user_id: userId };
  if (p.id !== undefined) r.id = p.id;
  if (p.notebookId !== undefined) r.notebook_id = p.notebookId;
  if (p.title !== undefined) r.title = p.title;
  if (p.content !== undefined) r.content = p.content;
  if (p.type !== undefined) r.note_type = p.type;
  if (p.color !== undefined) r.color = p.color ?? null;
  if (p.order !== undefined) r.order_index = p.order;
  if (p.date !== undefined) r.event_date = p.date ? new Date(p.date).toISOString() : null;
  if (p.time !== undefined) r.time_text = p.time ?? null;
  if (p.endTime !== undefined) r.end_time_text = p.endTime ?? null;
  if (p.showInCalendar !== undefined) r.show_in_calendar = p.showInCalendar;
  if (p.hideDate !== undefined) r.hide_date = p.hideDate;
  return r;
}

// Generate a real UUID for new client-side rows so Supabase accepts them.
export const newId = (): string =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? (crypto as any).randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
