import { useRef } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';

function ImageComponent({ node, editor, getPos }: { node: any; editor: any; getPos: () => number | undefined }) {
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

  return (
    <NodeViewWrapper
      className="relative group my-4"
      data-drag-handle
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <img
        src={node.attrs.src}
        alt={node.attrs.alt || ''}
        className="rounded-xl max-w-full h-auto shadow-sm"
        draggable={false}
      />
    </NodeViewWrapper>
  );
}

export const DraggableImage = Node.create({
  name: 'image',
  group: 'block',
  atom: true,
  draggable: true,

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
