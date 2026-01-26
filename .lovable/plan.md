

## Plan: Fixa bildpersistens + Lägg till drag-and-drop

### Problem att lösa
1. **Bilder sparas inte** - Base64-data kan överstiga localStorage-gränsen
2. **Flytta bilder/röstinspelningar** - Behöver tydlig drag-funktionalitet

---

### DEL 1: Fixa bildpersistens

#### Orsak
Base64-kodade bilder kan bli flera MB stora. localStorage har en gräns på 5-10MB per domän, och när all data (alla notes, tasks, events) överstiger detta, misslyckas sparningen tyst.

#### Lösning A: Aggressivare bildkomprimering
Minska bildkvaliteten och storleken för att hålla nere base64-storleken:

```text
NUVARANDE:     maxWidth: 1200px, quality: 0.8
NYTT:          maxWidth: 800px,  quality: 0.6
```

Detta minskar filstorleken med ca 60-70%.

#### Lösning B: Verifiera att sparningen fungerar
Lägg till en kontroll efter sparning för att fånga eventuella fel:

```tsx
// I handleSave:
try {
  if (note) {
    updateNote(note.id, noteData);
  } else {
    addNote(noteData);
  }
} catch (error) {
  console.error('Failed to save note:', error);
  // Visa felmeddelande till användaren
}
```

#### Lösning C: Lägg till en storleksvarning
Om en bild är för stor, varna användaren:

```tsx
const MAX_IMAGE_SIZE = 500 * 1024; // 500KB efter komprimering

const handleAddImage = async () => {
  // ... komprimera bilden ...
  
  if (compressedBase64.length > MAX_IMAGE_SIZE) {
    toast.warning('Bilden är stor och kan påverka prestanda');
  }
  
  editor?.chain().focus().setImage({ src: compressedBase64 }).run();
};
```

---

### DEL 2: Drag-and-drop för bilder och röstinspelningar

#### Nuläge
- `VoiceNoteExtension` har redan `draggable: true`
- TipTap's Image-extension stödjer drag som standard
- Men det saknas visuella indikationer för användaren

#### Lösning: Drag handle med visuell indikation

Skapa en wrapper-komponent för bilder som visar ett drag-handtag:

```text
┌─────────────────────────────────────┐
│  ⋮⋮  [Drag handle visas vid hover]  │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │        [BILD]               │    │
│  │                             │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

#### Implementation

##### 1. Skapa en custom Image extension med drag-handle

```tsx
// ImageWithDragHandle.tsx
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { GripVertical } from 'lucide-react';

function ImageComponent({ node, deleteNode }: { node: any; deleteNode: () => void }) {
  return (
    <NodeViewWrapper className="relative group my-4" data-drag-handle>
      {/* Drag handle - visas vid hover */}
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>
      
      {/* Bilden */}
      <img 
        src={node.attrs.src} 
        alt={node.attrs.alt || ''} 
        className="rounded-xl max-w-full h-auto shadow-sm"
        draggable={false}
      />
      
      {/* Delete-knapp vid hover */}
      <button
        onClick={deleteNode}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </NodeViewWrapper>
  );
}

export const DraggableImage = Node.create({
  name: 'image',
  group: 'block',
  atom: true,
  draggable: true,  // Aktivera drag
  
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
    };
  },
  
  parseHTML() {
    return [{ tag: 'img[src]' }];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)];
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(ImageComponent);
  },
});
```

##### 2. Uppdatera VoiceNotePlayer med drag-handle

```tsx
// Uppdatera VoiceNotePlayer.tsx
function VoiceNoteComponent({ node, deleteNode }: { node: any; deleteNode: () => void }) {
  return (
    <NodeViewWrapper className="relative group my-4" data-drag-handle>
      {/* Drag handle */}
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>
      
      <VoiceNotePlayer
        audioSrc={node.attrs.src}
        duration={node.attrs.duration}
        onDelete={deleteNode}
      />
    </NodeViewWrapper>
  );
}
```

##### 3. CSS för drag-interaktion

```css
/* Visuell feedback under drag */
.ProseMirror-selectednode {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
  border-radius: 12px;
}

/* Drag handle stil */
[data-drag-handle] {
  cursor: grab;
}

[data-drag-handle]:active {
  cursor: grabbing;
}
```

---

### Användarinteraktion

**För att flytta en bild eller röstinspelning:**
1. Hovra över bilden/röstinspelningen
2. Ett drag-handtag (⋮⋮) visas till vänster
3. Klicka och håll på handtaget
4. Dra till önskad position i texten
5. Släpp för att placera

---

### Filer att skapa/ändra

| Fil | Åtgärd |
|-----|--------|
| `src/lib/mediaUtils.ts` | Minska bildkomprimering (800px, 0.6 kvalitet) |
| `src/components/notes/DraggableImage.tsx` | NY - Custom image extension med drag-handle |
| `src/components/notes/VoiceNoteExtension.tsx` | Lägg till visuell drag-handle |
| `src/components/notes/NoteEditor.tsx` | Byt ut Image mot DraggableImage |
| `src/components/notes/NotebookPageEditor.tsx` | Samma ändringar |
| `src/index.css` | CSS för drag-feedback |

---

### Teknisk sammanfattning

**Bildpersistens:**
- Aggressivare komprimering minskar base64-storleken med 60-70%
- Detta bör lösa localStorage-gränsproblem för de flesta användningsfall

**Drag-and-drop:**
- Använder TipTaps inbyggda drag-funktionalitet
- Lägger till visuella drag-handles som visas vid hover
- Ger tydlig feedback under drag-operationen

**Framtida förbättring:**
Om localStorage-gränsen fortfarande blir ett problem, kan bilder och ljud lagras i Supabase Storage istället, med endast URL:er sparade i notes.

