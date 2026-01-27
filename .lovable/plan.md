

## Plan: Add End Time for Tasks

### Overview
Add the ability to set an end time for tasks when editing them in the calendar. The end time option will appear after a start time has been selected.

---

### Step 1: Update Task Type

**File**: `src/types/index.ts`

Add `endTime` field to the Task interface:

```tsx
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  hidden?: boolean;
  date?: Date;
  time?: string;      // Start time
  endTime?: string;   // NEW: End time
  category: string;
  color: PastelColor;
  subtasks: Subtask[];
  notes?: string;
  priority: Priority;
  createdAt: Date;
}
```

---

### Step 2: Update TaskEditPanel

**File**: `src/components/tasks/TaskEditPanel.tsx`

Add end time picker that appears when start time is set:

```text
Current layout:
[Category] [Date] [Time] [Hide] [Delete]

New layout:
[Category] [Date] [Time] [End Time?] [Hide] [Delete]
                          ↑ Only shows when Time is set
```

**Changes:**
1. Add state for `tempEndTime`
2. Add `handleEndTimeChange` function
3. Add end time button + popover (conditionally rendered when `task.time` exists)
4. Display time range when both times are set (e.g., "09:00 - 10:00")

```tsx
// New state
const [tempEndTime, setTempEndTime] = useState(task.endTime || '');

// New handler
const handleEndTimeChange = (endTime: string) => {
  setTempEndTime(endTime);
  updateTask(task.id, { endTime: endTime || undefined });
};

// Updated time button display
<span>{task.time}{task.endTime ? ` - ${task.endTime}` : ''}</span>

// New end time picker (shown only when start time exists)
{task.time && (
  <Popover>
    <PopoverTrigger asChild>
      <button className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium',
        'bg-secondary hover:bg-muted',
        task.endTime ? 'text-foreground' : 'text-muted-foreground'
      )}>
        <Clock className="w-3.5 h-3.5" />
        <span>{task.endTime || 'End'}</span>
      </button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-3 bg-card border-border">
      <input
        type="time"
        value={tempEndTime}
        onChange={(e) => handleEndTimeChange(e.target.value)}
        min={task.time}
        className="flow-input"
      />
    </PopoverContent>
  </Popover>
)}
```

---

### Step 3: Update CalendarItemList

**File**: `src/components/calendar/CalendarItemList.tsx`

Update task display to show time range and use `endTime` for visual positioning:

```tsx
// Line ~88: Include endTime for tasks
dayTasks.forEach(t => items.push({ 
  type: 'task', 
  item: t, 
  time: t.time, 
  endTime: (t as Task).endTime  // NEW
}));

// Line ~128: Include endTime for timed tasks
timedTasks.forEach(t => items.push({ 
  type: 'task', 
  item: t, 
  time: t.time!, 
  endTime: t.endTime  // NEW
}));
```

The timeline already handles `endTime` for calculating height, so tasks with end times will display correctly with proper duration.

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `endTime?: string` to Task interface |
| `src/components/tasks/TaskEditPanel.tsx` | Add end time picker (appears when start time is set) |
| `src/components/calendar/CalendarItemList.tsx` | Pass `endTime` for tasks to timeline |

---

### Visual Result

**TaskEditPanel with start time set:**
```text
┌────────────────────────────────────────────────────────────────┐
│ Edit Task                                                  [X] │
├────────────────────────────────────────────────────────────────┤
│ [Work] [Jan 27] [09:00] [End ▾] [Hide] [Delete]               │
│                          ↑ New button                          │
└────────────────────────────────────────────────────────────────┘
```

**TaskEditPanel with both times set:**
```text
┌────────────────────────────────────────────────────────────────┐
│ Edit Task                                                  [X] │
├────────────────────────────────────────────────────────────────┤
│ [Work] [Jan 27] [09:00 - 10:00] [Hide] [Delete]               │
│                  ↑ Shows range                                 │
└────────────────────────────────────────────────────────────────┘
```

