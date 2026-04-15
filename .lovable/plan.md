

## Ta bort "No Folder" från Folders-vy och FolderPickerSheet

### Vad ändras

**1. `src/components/views/NotesView.tsx`**
- Ta bort hela "No folder section" (rad ~536–560) — den grå pseudo-mappen som samlar anteckningar utan folder.

**2. `src/components/notes/FolderPickerSheet.tsx`**
- Ta bort "No folder"-knappen (rad ~58–69) — alternativet att välja "No folder" i folder-väljaren.
- Anteckningar utan folder visas bara i "All Notes"-listan, precis som du vill.

### Vad behålls
- Man kan fortfarande skapa anteckningar utan att välja en folder — de hamnar bara inte under Folders-fliken.
- Folder-väljaren visar bara befintliga mappar + "New folder"-knappen.

### Två filer ändras, inga nya filer.

