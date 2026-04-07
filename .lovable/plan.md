

## Problem

When a sticky note is clicked in the calendar, the flow is:
1. `handleItemClick` sets `editingNote` → opens `CalendarNoteModal` (generic preview — wrong)
2. Clicking "Open" in that modal opens `NoteEditor` (regular editor — also wrong)

Sticky notes are never routed to `StickyNoteEditor`.

## Solution

Modify `CalendarView.tsx` to detect sticky notes (`note.type === 'sticky'`) and open them directly in `StickyNoteEditor` instead of going through the `CalendarNoteModal` preview.

### File: `src/components/views/CalendarView.tsx`

1. **Import `StickyNoteEditor`**

2. **Add state**: `editingStickyNote` (separate from `editingNote`) to track when a sticky note should be shown

3. **Update `handleItemClick`**: When a note is clicked, check `note.type`:
   - If `'sticky'` → set `editingStickyNote` (skip CalendarNoteModal entirely)
   - If `'note'` → keep current behavior (CalendarNoteModal preview)

4. **Update `handleOpenFullNoteEditor`**: Same check — if sticky, open StickyNoteEditor; if regular, open NoteEditor

5. **Render `StickyNoteEditor`** as a full-screen overlay when `editingStickyNote` is set, alongside existing modals

### No other files need changes

The `StickyNoteEditor` already accepts an optional `note` prop and renders as a full-screen overlay with the correct sticky note styling and color.

