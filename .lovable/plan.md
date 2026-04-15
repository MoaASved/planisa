

## Fixa folder-ikonens färg i detaljvyn

### Problem
Folder-ikonen i detaljvyn använder en dynamisk Tailwind-klass (`text-[hsl(var(--pastel-${selectedFolder.color}))]`) som kan misslyckas med JIT-kompilering. Notebook-vyn använder istället inline `style` som alltid fungerar.

### Lösning
I `src/components/views/NotesView.tsx`, rad 271 — ändra från Tailwind-klass till inline `style`, precis som NotebookView gör:

**Före:**
```tsx
<FolderOpen className={`w-5 h-5 text-[hsl(var(--pastel-${selectedFolder.color}))]`} />
```

**Efter:**
```tsx
<FolderOpen className="w-5 h-5" style={{ color: `hsl(var(--pastel-${selectedFolder.color}))` }} />
```

### En rad ändras i en fil.

