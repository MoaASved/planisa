

## Plan: Bildalbum + Optimerad Toolbar

### Problem
1. `input.capture = 'environment'` tvingar kameran istället för att visa val mellan kamera/album
2. Toolbaren har för många knappar (~15 st) som kräver sidoscrollning

---

### DEL 1: Tillåt bildval från album

**Ändring i båda editorerna:**

```tsx
// Ta bort denna rad:
input.capture = 'environment';

// Behåll endast:
input.type = 'file';
input.accept = 'image/*';
```

Detta ger användaren valet att antingen ta ett nytt foto eller välja från albumet.

---

### DEL 2: Optimerad Toolbar - Förslag

**Nuvarande layout (15+ knappar):**
```
[Pin][Folder][Delete] | [Settings] | [H1][H2][T] | [B][I] | [List][NumList][Check] | [Align][Highlight] | [Image][Mic] | [Collapse]
```

**Ny optimerad layout (8 synliga + 1 dropdown):**

```
┌─────────────────────────────────────────────────────────────────┐
│  [←]  [Pin]  [Folder]  │  [Aa▼]  [B]  [I]  │  [+▼]  [⚙]  [×]  │
└─────────────────────────────────────────────────────────────────┘
```

#### Gruppering:

| Knapp | Innehåll |
|-------|----------|
| **[Aa▼]** | Dropdown: H1, H2, Body text |
| **[B]** | Bold (ofta använd, behåll synlig) |
| **[I]** | Italic (ofta använd, behåll synlig) |
| **[+▼]** | Insert-meny: Bullet list, Numbered list, Checklist, Image, Voice, Highlight |
| **[⚙]** | Settings (datum, visa i kalender, etc.) |
| **[×]** | Delete (endast för befintliga notes) |

#### Visuellt förslag:

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│   (←)    📌   📁   │   [Aa ▼]   B   I   │   [+ ▼]   ⚙   🗑            │
│                                                                        │
│          ┌──────────┐         ┌─────────────────┐                     │
│          │ Heading 1│         │ • Bullet list   │                     │
│          │ Heading 2│         │ 1. Numbered list│                     │
│          │ Body     │         │ ☑ Checklist     │                     │
│          │ ─────────│         │ ─────────────── │                     │
│          │ ≡ Align  │         │ 🖼 Image        │                     │
│          └──────────┘         │ 🎤 Voice        │                     │
│                               │ ─────────────── │                     │
│                               │ 🖍 Highlight    │                     │
│                               └─────────────────┘                     │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

### DEL 3: Implementation

#### 3.1 Skapa FormatDropdown-komponent

```tsx
// Aa-dropdown för textformatering
<DropdownMenu>
  <DropdownMenuTrigger className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-secondary/50">
    <span className="text-sm font-medium">Aa</span>
    <ChevronDown className="w-3 h-3" />
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}>
      <span className="text-lg font-bold">Heading 1</span>
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
      <span className="text-base font-semibold">Heading 2</span>
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => editor?.chain().focus().setParagraph().run()}>
      <span className="text-sm">Body text</span>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={cycleAlignment}>
      <AlignIcon className="w-4 h-4 mr-2" />
      <span>Alignment</span>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

#### 3.2 Skapa InsertDropdown-komponent

```tsx
// +-dropdown för att infoga element
<DropdownMenu>
  <DropdownMenuTrigger className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-secondary/50">
    <Plus className="w-4 h-4" />
    <ChevronDown className="w-3 h-3" />
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => editor?.chain().focus().toggleBulletList().run()}>
      <List className="w-4 h-4 mr-2" />
      <span>Bullet list</span>
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
      <ListOrdered className="w-4 h-4 mr-2" />
      <span>Numbered list</span>
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => editor?.chain().focus().toggleTaskList().run()}>
      <CheckSquare className="w-4 h-4 mr-2" />
      <span>Checklist</span>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleAddImage}>
      <ImageIcon className="w-4 h-4 mr-2" />
      <span>Image</span>
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => setShowVoiceRecorder(true)}>
      <Mic className="w-4 h-4 mr-2" />
      <span>Voice note</span>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={() => setShowHighlightPicker(true)}>
      <Highlighter className="w-4 h-4 mr-2" />
      <span>Highlight</span>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### DEL 4: Filer att ändra

| Fil | Ändring |
|-----|---------|
| `src/components/notes/NoteEditor.tsx` | Ta bort `capture`, implementera dropdown-menyer |
| `src/components/notes/NotebookPageEditor.tsx` | Samma ändringar |

---

### Resultat

- **Bilduppladdning**: Användaren kan nu välja mellan kamera och album
- **Toolbar**: Renare med 8 synliga element istället för 15+
- **Dropdowns**: Logiskt grupperade funktioner som är lätta att hitta
- **Modern design**: Följer iOS/Apple-mönster med dropdown-menyer

