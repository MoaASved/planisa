

## Plan: Ta bort delete-knappen från bilder

### Översikt
Ta bort den synliga delete-knappen (krysset) från bilder i editorn. Användare kan radera bilder genom att:
1. Klicka på bilden för att markera den
2. Trycka Delete eller Backspace på tangentbordet

Detta ger en renare, mer minimalistisk design.

---

### Ändring

**Fil: `src/components/notes/DraggableImage.tsx`**

Ta bort delete-knappen helt:

```tsx
function ImageComponent({ node, deleteNode }: { node: any; deleteNode: () => void }) {
  return (
    <NodeViewWrapper className="relative group my-4" data-drag-handle>
      {/* Drag handle - visible on hover */}
      <div 
        className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        contentEditable={false}
      >
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>
      
      {/* Image */}
      <img 
        src={node.attrs.src} 
        alt={node.attrs.alt || ''} 
        className="rounded-xl max-w-full h-auto shadow-sm"
        draggable={false}
      />
      
      {/* Delete button REMOVED - use keyboard Delete/Backspace instead */}
    </NodeViewWrapper>
  );
}
```

---

### Resultat

- Renare, mer minimalistisk design utan krysset på bilden
- Drag-handtaget (⋮⋮) finns kvar för att flytta bilden
- Radering sker via tangentbordet (Delete/Backspace) efter att bilden markerats
- Följer samma mönster som andra textredigerare (Google Docs, Apple Notes)

