

## Plan: Uppdatera Undo-toast till Engelska + Modern Design

### Sammanfattning
Byta alla svenska texter till engelska och göra toasten mindre, mer minimalistisk och smidig.

---

## Ändringar

### 1. `src/hooks/useUndoableDelete.ts`
Uppdatera alla svenska texter till engelska.

**Rad 10-17 - Delete-meddelanden:**
```typescript
// Före (svenska):
case 'task': return 'Uppgift raderad';
case 'event': return 'Event raderat';
case 'note': return 'Anteckning raderad';
case 'notebookPage': return 'Sida raderad';

// Efter (engelska):
case 'task': return 'Task deleted';
case 'event': return 'Event deleted';
case 'note': return 'Note deleted';
case 'notebookPage': return 'Page deleted';
```

**Rad 42 - Undo-knapp:**
```typescript
// Före: label: 'Ångra'
// Efter: label: 'Undo'
```

**Rad 117 - Återställd-meddelande:**
```typescript
// Före: toast.success('Återställd!')
// Efter: toast.success('Restored!')
```

---

### 2. `src/components/ui/sonner.tsx`
Gör toasten mer kompakt och minimalistisk.

**Nya stilar:**
- Mindre padding och font-storlek
- Subtilare skugga
- Smalare, mer kompakt action-knapp
- Mindre border-radius för smidigare look

```tsx
<Sonner
  theme="light"
  className="toaster group"
  position="bottom-center"
  toastOptions={{
    classNames: {
      toast:
        "group toast group-[.toaster]:bg-card/95 group-[.toaster]:backdrop-blur-sm group-[.toaster]:text-foreground group-[.toaster]:text-sm group-[.toaster]:border-border/50 group-[.toaster]:shadow-soft group-[.toaster]:rounded-xl group-[.toaster]:py-2.5 group-[.toaster]:px-3",
      description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs",
      actionButton: "group-[.toast]:bg-foreground group-[.toast]:text-background group-[.toast]:rounded-lg group-[.toast]:text-xs group-[.toast]:font-medium group-[.toast]:py-1 group-[.toast]:px-2.5",
      cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg group-[.toast]:text-xs",
    },
  }}
  {...props}
/>
```

---

## Visuell skillnad

**Före:**
```text
┌───────────────────────────────────────────┐
│                                           │
│   Uppgift raderad            [ Ångra ]    │
│                                           │
└───────────────────────────────────────────┘
```

**Efter (mindre, smidigare):**
```text
┌────────────────────────────────┐
│ Task deleted        [Undo]    │
└────────────────────────────────┘
```

---

## Sammanfattning

| Fil | Ändring |
|-----|---------|
| `src/hooks/useUndoableDelete.ts` | Svenska → Engelska texter |
| `src/components/ui/sonner.tsx` | Kompaktare, mer minimalistisk styling |

