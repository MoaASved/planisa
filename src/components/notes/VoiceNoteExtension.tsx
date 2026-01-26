import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { GripVertical } from 'lucide-react';
import { VoiceNotePlayer } from './VoiceNotePlayer';

// Component to render the voice note in the editor with drag handle
function VoiceNoteComponent({ node, deleteNode }: { node: any; deleteNode: () => void }) {
  return (
    <NodeViewWrapper className="relative group voice-note-wrapper my-4" data-drag-handle>
      {/* Drag handle - visible on hover */}
      <div 
        className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        contentEditable={false}
      >
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

// TipTap extension for voice notes
export const VoiceNoteExtension = Node.create({
  name: 'voiceNote',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      duration: {
        default: 0,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-voice-note]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-voice-note': '' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VoiceNoteComponent);
  },
});

// Helper to insert a voice note into the editor
export const insertVoiceNote = (editor: any, src: string, duration: number) => {
  editor
    .chain()
    .focus()
    .insertContent({
      type: 'voiceNote',
      attrs: { src, duration },
    })
    .run();
};
