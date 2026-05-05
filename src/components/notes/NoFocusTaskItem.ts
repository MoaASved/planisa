import TaskItem from '@tiptap/extension-task-item';

// Replacement for TipTap's TaskItem that never calls editor.chain().focus().
// Toggle is handled via touchstart on the label wrapper so e.preventDefault()
// is called directly on the tap target — iOS respects this and won't focus
// the parent contenteditable. Desktop uses click.
export const NoFocusTaskItem = TaskItem.extend({
  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor }) => {
      const listItem = document.createElement('li');
      const checkboxWrapper = document.createElement('label');
      const checkboxStyler = document.createElement('span');
      const checkbox = document.createElement('input');
      const content = document.createElement('div');

      checkboxWrapper.contentEditable = 'false';
      checkbox.type = 'checkbox';
      checkbox.tabIndex = -1;

      const toggle = () => {
        if (!editor.isEditable || typeof getPos !== 'function') return;
        const pos = getPos();
        if (typeof pos !== 'number') return;
        const n = editor.state.doc.nodeAt(pos);
        if (!n) return;
        editor.view.dispatch(
          editor.state.tr.setNodeMarkup(pos, undefined, {
            ...n.attrs,
            checked: !n.attrs.checked,
          })
        );
      };

      let touchHandled = false;

      checkboxWrapper.addEventListener('mousedown', (e) => e.preventDefault());

      // Touch: preventDefault directly on the tap target stops iOS from focusing
      // the parent contenteditable. No focus() call anywhere in this handler.
      checkboxWrapper.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        touchHandled = true;
        toggle();
        setTimeout(() => { touchHandled = false; }, 500);
      }, { passive: false });

      // Desktop fallback — touchstart.preventDefault skips this on mobile.
      checkboxWrapper.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!touchHandled) toggle();
      });

      Object.entries(this.options.HTMLAttributes).forEach(([key, value]) => {
        listItem.setAttribute(key, value);
      });
      listItem.dataset.checked = node.attrs.checked;
      checkbox.checked = node.attrs.checked;
      checkboxWrapper.append(checkbox, checkboxStyler);
      listItem.append(checkboxWrapper, content);
      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        listItem.setAttribute(key, value);
      });

      return {
        dom: listItem,
        contentDOM: content,
        update: (updatedNode) => {
          if (updatedNode.type !== this.type) return false;
          listItem.dataset.checked = updatedNode.attrs.checked;
          checkbox.checked = updatedNode.attrs.checked;
          return true;
        },
      };
    };
  },
});
