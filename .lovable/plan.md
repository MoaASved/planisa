

## Remove selection border, add shadow on selected images

Replace the current outline/border on selected images in the editor with a subtle shadow effect.

### Change

**`src/index.css`** - Update `.ProseMirror-selectednode` style:
- Remove `outline` and `outline-offset`
- Add `box-shadow: 0 4px 16px rgba(0,0,0,0.15)` for a soft elevation effect
- Keep existing `border-radius: 12px`

