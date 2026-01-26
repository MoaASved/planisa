import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { GripVertical, X } from 'lucide-react';

// Component to render the draggable image in the editor
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
      
      {/* Delete button on hover */}
      <button
        onClick={deleteNode}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 active:scale-95"
        contentEditable={false}
      >
        <X className="w-4 h-4" />
      </button>
    </NodeViewWrapper>
  );
}

// TipTap extension for draggable images
export const DraggableImage = Node.create({
  name: 'image',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)];
  },


  addNodeView() {
    return ReactNodeViewRenderer(ImageComponent);
  },
});
