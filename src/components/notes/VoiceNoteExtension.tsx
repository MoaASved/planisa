import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { VoiceNotePlayer } from './VoiceNotePlayer';

// Component to render the voice note in the editor
function VoiceNoteComponent({ node, deleteNode }: { node: any; deleteNode: () => void }) {
  return (
    <NodeViewWrapper className="voice-note-wrapper my-4">
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
