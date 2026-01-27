

## Plan: Fix Date Display on Notes List + Allow Untitled Notes in Calendar

### Overview
Two fixes needed:
1. Show the note's assigned date (`note.date`) on the Notes start page, not just `updatedAt`
2. Allow notes without a title to appear in the calendar with "Untitled" as fallback

---

### Issue 1: Date Not Syncing to Notes Start Page

**Current behavior**: The NoteCard in NotesView displays `format(new Date(note.updatedAt), 'MMM d')` - this shows when the note was last edited, NOT the note's assigned date.

**Expected behavior**: When you change the date in the note editor, that date should appear on the Notes start page.

**Fix**: Update the NoteCard component to show `note.date` (if available) instead of `note.updatedAt`.

**File**: `src/components/views/NotesView.tsx`

```tsx
// Line ~169-172 - Current:
<span className="text-xs text-muted-foreground">
  {format(new Date(note.updatedAt), 'MMM d')}
</span>

// After - Use note.date when available:
<span className="text-xs text-muted-foreground">
  {format(new Date(note.date || note.updatedAt), 'MMM d')}
</span>
```

---

### Issue 2: Notes Without Title Not Showing in Calendar

**Current behavior**: Notes render their title directly: `{note.title}` - if empty, nothing shows.

**Expected behavior**: Notes with `showInCalendar` enabled should appear even without a title, showing "Untitled" as fallback.

**Fix**: Add fallback text for empty titles in CalendarItemList.

**File**: `src/components/calendar/CalendarItemList.tsx`

```tsx
// Line 277 - Current:
<span className={cn('font-medium truncate', compact ? 'text-xs' : 'text-sm')}>
  {note.title}
</span>

// After - Add fallback:
<span className={cn('font-medium truncate', compact ? 'text-xs' : 'text-sm')}>
  {note.title || 'Untitled'}
</span>
```

---

### Bonus: Fix Swedish locale in CalendarItemList

The file still uses Swedish locale on line 3 and 287. Should be updated to English to match the rest of the app.

**File**: `src/components/calendar/CalendarItemList.tsx`

```tsx
// Line 3 - Remove:
import { sv } from 'date-fns/locale';

// Line 287 - Current:
const formattedDate = format(date, 'd MMMM', { locale: sv });

// After:
const formattedDate = format(date, 'MMMM d');
```

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/components/views/NotesView.tsx` | Display `note.date` instead of `note.updatedAt` in NoteCard |
| `src/components/calendar/CalendarItemList.tsx` | Add "Untitled" fallback for notes without title |
| `src/components/calendar/CalendarItemList.tsx` | Change date format to English |

