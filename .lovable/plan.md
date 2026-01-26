

## Plan: Modern Toggle Design + English Text + Undo/Redo

### Overview
1. Redesign toggle buttons in the Notes settings panel for a cleaner, more modern iOS-style look
2. Change all dates from Swedish to English
3. Add undo/redo buttons to the toolbar

---

### DEL 1: Modern Toggle Button Design

**Current problem**: The toggles are fully colored when "on" (`bg-primary` = dark fill), making them visually heavy and unclear.

**New design**: A subtle, minimal toggle inspired by iOS with:
- A thin border when OFF
- A subtle background tint + checkmark indicator when ON
- No full-color fill

```text
OFF state:                    ON state:
┌─────────────────┐          ┌─────────────────┐
│  ○──────────    │          │    ──────────● ✓│
│  (gray outline) │          │  (subtle tint)  │
└─────────────────┘          └─────────────────┘
```

**Implementation**: Create a cleaner toggle style:

```tsx
// New modern toggle design
<button
  onClick={() => setState(!state)}
  className={cn(
    'w-11 h-6 rounded-full transition-all duration-200 relative',
    state 
      ? 'bg-primary/20 border border-primary/40' 
      : 'bg-secondary/50 border border-border'
  )}
>
  <span 
    className={cn(
      'absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200 shadow-sm',
      state 
        ? 'translate-x-5 bg-primary' 
        : 'translate-x-0.5 bg-muted-foreground/30'
    )}
  />
</button>
```

**Alternative - even more minimal (checkbox-style)**:

```tsx
// Minimal checkbox toggle
<button
  onClick={() => setState(!state)}
  className={cn(
    'w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center',
    state 
      ? 'bg-primary/10 border-primary' 
      : 'border-muted-foreground/30'
  )}
>
  {state && <Check className="w-3 h-3 text-primary" />}
</button>
```

---

### DEL 2: Change Dates to English

**Files with Swedish locale:**
- `src/components/notes/NoteEditor.tsx` - Lines 3, 421, 467

**Changes:**
```tsx
// BEFORE (line 3)
import { sv } from 'date-fns/locale';

// AFTER - remove import entirely or change to:
import { enUS } from 'date-fns/locale';

// BEFORE (line 421)
{format(date, 'd MMMM yyyy', { locale: sv })}

// AFTER
{format(date, 'MMMM d, yyyy')}

// BEFORE (line 467)
{format(date, 'd MMM yyyy', { locale: sv })}

// AFTER
{format(date, 'MMM d, yyyy')}
```

**Also update toast messages to English:**
```tsx
// Line 202
toast.warning('Image is large and may affect performance');

// Line 211  
toast.error('Could not add image');
```

---

### DEL 3: Add Undo/Redo Buttons

TipTap has built-in undo/redo support via the history extension (included in StarterKit).

**Placement**: Add to the left side of the toolbar, next to Pin/Folder buttons.

```text
New toolbar layout:
┌──────────────────────────────────────────────────────────────────────────┐
│  [↶][↷]  [Pin][Folder]  │  [Aa▼]  [B]  [I]  │  [+▼]  [⚙]  [🗑]  [▲]    │
│  undo/redo              │                    │                           │
└──────────────────────────────────────────────────────────────────────────┘
```

**Implementation:**

```tsx
import { Undo2, Redo2 } from 'lucide-react';

// In the toolbar, left group:
<div className="flex items-center gap-0.5">
  <ToolbarBtn 
    onClick={() => editor?.chain().focus().undo().run()}
    disabled={!editor?.can().undo()}
  >
    <Undo2 className="w-4 h-4" />
  </ToolbarBtn>
  <ToolbarBtn 
    onClick={() => editor?.chain().focus().redo().run()}
    disabled={!editor?.can().redo()}
  >
    <Redo2 className="w-4 h-4" />
  </ToolbarBtn>
  
  {/* Separator */}
  <div className="w-px h-4 bg-border mx-1" />
  
  <ToolbarBtn onClick={handleTogglePin} active={isPinned}>
    <Pin className="w-4 h-4" />
  </ToolbarBtn>
  // ...
</div>
```

**Update ToolbarBtn to handle disabled state:**

```tsx
const ToolbarBtn = ({
  onClick, 
  active, 
  disabled,
  children, 
  // ...
}: { 
  onClick: () => void; 
  active?: boolean;
  disabled?: boolean;
  // ...
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'p-1.5 rounded-lg transition-all duration-150 active:scale-90',
      disabled && 'opacity-30 cursor-not-allowed active:scale-100',
      // ...
    )}
  >
    {children}
  </button>
);
```

---

### Files to Change

| File | Changes |
|------|---------|
| `src/components/notes/NoteEditor.tsx` | Modern toggle design, English dates/text, add Undo/Redo |
| `src/components/notes/NotebookPageEditor.tsx` | Modern toggle design, add Undo/Redo |

---

### Visual Summary

**Before Toggle:**
```
┌───────────────────────────────────────┐
│ Show in Calendar       ████████○     │  ← Dark filled = unclear
└───────────────────────────────────────┘
```

**After Toggle:**
```
┌───────────────────────────────────────┐
│ Show in Calendar       ○─────────●   │  ← Subtle, modern
│                        │ tint bg │   │
└───────────────────────────────────────┘
```

**Undo/Redo placement:**
```
┌─────────────────────────────────────────────┐
│  ↶ ↷ │ 📌 📁 │ Aa▼  B  I │ +▼  ⚙  🗑  ▲   │
└─────────────────────────────────────────────┘
```

