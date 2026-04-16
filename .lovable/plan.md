

## Fix & redesign task creation flow

### Problem
`InlineTaskInput` creates tasks with no date, no priority, no category → task doesn't match Today/Priority/any List filter → vanishes. There's also no per-section "+ Add" affordance.

### Solution

**1. Extend `InlineTaskInput` with a `mode` prop** (`src/components/tasks/InlineTaskInput.tsx`)
- `mode: 'today' | 'priority' | 'uncategorized'` controls what gets stamped on creation:
  - `today` → `date: new Date()`
  - `priority` → `priority: 'high'`
  - `uncategorized` → no date, no priority, empty category (lands in "Tasks without category")
- Add placeholder per mode: "Write a task...", "Important task...", "Add a task..."
- Keep blur-to-save and Enter-to-save behavior.

**2. Inline "+ Add" toggle in section headers** (`src/components/views/TasksView.tsx`)
- Modify `TaskSection` to accept an optional `onAdd` callback + `isAdding` state.
- Header right side: `count` + `+` button. Tapping `+` reveals an inline `InlineTaskInput` directly under the header.
- Tap again (or blur with empty) closes it.

**3. Add "Tasks without category" section** under Today and Priority
- Filter: `!t.completed && !t.date && t.priority === 'none' && !t.category`
- Same `TaskSection` component, with its own inline add (mode `uncategorized`).
- Empty state: hide section entirely if no tasks AND not currently adding (to keep first view tidy).

**4. Wire `isCreatingNewTask` (from FAB Quick Create)** to open the "Tasks without category" inline input by default — guarantees the task is visible immediately wherever the user creates it.

**5. Bottom `InlineTaskInput` removed** — replaced by per-section inline inputs. No more orphan tasks.

### Files changed
- `src/components/tasks/InlineTaskInput.tsx` — add `mode` prop, stamp date/priority on create.
- `src/components/views/TasksView.tsx` — header `+` per section, add "Tasks without category" section, remove bottom input, route FAB creation to uncategorized.

### Result
- Tap `+` in TODAY → input appears, save → task instantly visible in Today (has today's date).
- Tap `+` in PRIORITY → input appears, save → task instantly visible in Priority (priority=high).
- Tap `+` in TASKS WITHOUT CATEGORY (or via global FAB) → task instantly visible there.
- No task can ever disappear after creation.

