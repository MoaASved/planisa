

## Keep rounded border on selected images

Add back a subtle rounded border alongside the shadow on selected images in the editor.

### Change

**`src/index.css`** - Update `.ProseMirror-selectednode` style:
- Keep `outline: none` and the shadow
- Add `border: 2px solid rgba(0,0,0,0.08)` for a soft visible rounded edge
- Add `overflow: hidden` so the border-radius clips the image content properly
- Keep existing `border-radius: 12px`

