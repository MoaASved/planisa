

## Plan: Fixa Toggle-knapparna

### Problemet
Toggle-cirkeln går utanför ramen eftersom:
- Container: 44px bred × 24px hög
- Cirkel: 20px × 20px  
- `translate-x-5` (20px) + startposition (2px) = 22px, men utrymmet är bara 44px - 20px = 24px

### Lösning
Justera toggle-designen så cirkeln alltid stannar innanför ramen:

**Alternativ 1: Justera translate-värdet**
```tsx
// Ändra från translate-x-5 (20px) till translate-x-[18px]
<button
  className={cn(
    'w-11 h-6 rounded-full transition-all duration-200 relative',
    active ? 'bg-primary/20 border border-primary/40' : 'bg-secondary/50 border border-border'
  )}
>
  <span 
    className={cn(
      'absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all duration-200 shadow-sm',
      active ? 'translate-x-[18px] bg-primary' : 'translate-x-0 bg-muted-foreground/30'
    )}
  />
</button>
```

**Alternativ 2: Använd flexbox istället för absolute positioning (rekommenderat)**
```tsx
<button
  className={cn(
    'w-11 h-6 rounded-full transition-all duration-200 flex items-center px-0.5',
    active ? 'bg-primary/20 border border-primary/40 justify-end' : 'bg-secondary/50 border border-border justify-start'
  )}
>
  <span 
    className={cn(
      'w-5 h-5 rounded-full transition-all duration-200 shadow-sm',
      active ? 'bg-primary' : 'bg-muted-foreground/30'
    )}
  />
</button>
```

### Beräkning för Alternativ 1
- Container bredd: 44px (w-11)
- Cirkel: 20px (w-5)  
- Padding vänster: 2px (left-0.5)
- Tillgängligt utrymme: 44px - 20px - 2px - 2px = 20px → `translate-x-[18px]` eller `translate-x-5` men med `left-0.5` fast position

### Filer att ändra
| Fil | Ändring |
|-----|---------|
| `src/components/notes/NoteEditor.tsx` | Fixa alla 3 toggle-knappar |
| `src/components/notes/NotebookPageEditor.tsx` | Fixa alla toggle-knappar |

### Visuellt resultat
```text
OFF:                          ON:
┌────────────────────┐       ┌────────────────────┐
│ ●                  │       │                  ● │
│ (grå cirkel)       │       │       (primär)     │
└────────────────────┘       └────────────────────┘
  ↑ Stannar innanför           ↑ Stannar innanför
```

