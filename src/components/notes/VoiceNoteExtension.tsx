import { useRef } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { VoiceNotePlayer } from './VoiceNotePlayer';

function VoiceNoteComponent({ node, editor, getPos, deleteNode, selected }: { node: any; editor: any; getPos: () => number | undefined; deleteNode: () => void; selected: boolean }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);

  const cancelTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse') return;
    const el = e.currentTarget;
    const pointerId = e.pointerId;
    startRef.current = { x: e.clientX, y: e.clientY };
    timerRef.current = setTimeout(() => {
      draggingRef.current = true;
      try { el.setPointerCapture(pointerId); } catch {}
    }, 500);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!startRef.current || draggingRef.current) return;
    const dx = Math.abs(e.clientX - startRef.current.x);
    const dy = Math.abs(e.clientY - startRef.current.y);
    if (dx > 8 || dy > 8) { cancelTimer(); startRef.current = null; }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLElement>) => {
    cancelTimer();
    if (!draggingRef.current) { startRef.current = null; return; }
    draggingRef.current = false;
    startRef.current = null;

    const nodePos = getPos();
    if (nodePos == null) return;
    const view = editor.view;
    const drop = view.posAtCoords({ left: e.clientX, top: e.clientY });
    if (!drop) return;
    const srcStart = nodePos;
    const srcEnd = nodePos + node.nodeSize;
    if (drop.pos >= srcStart && drop.pos <= srcEnd) return;
    const nodeToMove = view.state.doc.nodeAt(srcStart);
    if (!nodeToMove) return;
    const tr = view.state.tr;
    if (drop.pos > srcEnd) {
      tr.insert(drop.pos, nodeToMove);
      tr.delete(srcStart, srcEnd);
    } else {
      tr.delete(srcStart, srcEnd);
      tr.insert(drop.pos, nodeToMove);
    }
    view.dispatch(tr);
  };

  const onPointerCancel = () => {
    cancelTimer();
    draggingRef.current = false;
    startRef.current = null;
  };

  const moveUp = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nodePos = getPos();
    if (nodePos == null) return;
    const $pos = editor.state.doc.resolve(nodePos);
    if (!$pos.nodeBefore) return;
    const prevStart = nodePos - $pos.nodeBefore.nodeSize;
    const nodeToMove = editor.state.doc.nodeAt(nodePos);
    if (!nodeToMove) return;
    const tr = editor.state.tr;
    tr.delete(nodePos, nodePos + node.nodeSize);
    tr.insert(prevStart, nodeToMove);
    editor.view.dispatch(tr);
  };

  const moveDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nodePos = getPos();
    if (nodePos == null) return;
    const nodeEnd = nodePos + node.nodeSize;
    const $end = editor.state.doc.resolve(nodeEnd);
    if (!$end.nodeAfter) return;
    const nodeToMove = editor.state.doc.nodeAt(nodePos);
    if (!nodeToMove) return;
    const tr = editor.state.tr;
    tr.delete(nodePos, nodeEnd);
    tr.insert(nodePos + $end.nodeAfter.nodeSize, nodeToMove);
    editor.view.dispatch(tr);
  };

  return (
    <NodeViewWrapper
      className="relative group voice-note-wrapper my-4"
      data-drag-handle
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <VoiceNotePlayer
        audioSrc={node.attrs.src}
        duration={node.attrs.duration}
        onDelete={deleteNode}
      />
      {selected && (
        <div contentEditable={false} className="absolute top-2 right-2 flex flex-col gap-1 z-10">
          <button
            onPointerDown={moveUp}
            className="w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center text-xs hover:bg-black/60 transition-colors select-none"
          >↑</button>
          <button
            onPointerDown={moveDown}
            className="w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center text-xs hover:bg-black/60 transition-colors select-none"
          >↓</button>
        </div>
      )}
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
