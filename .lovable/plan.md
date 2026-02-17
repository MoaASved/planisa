

## Fix: Vertical centering of nav icons + Quick Create popup positioning

### Issue 1 -- Vertical centering

The plus button has `-mt-5` which pulls it upward to create the elevated effect. This negative margin shifts the entire flex container's alignment. The `safe-bottom` class also adds extra bottom padding via `env(safe-area-inset-bottom)`, creating uneven vertical spacing.

**Fix in `src/index.css`:**
- Remove `-mt-5` from `.flow-nav-center-btn` -- instead use a negative `margin-bottom` approach or `relative` + negative `top` so the button floats upward without affecting the flex layout of sibling items.
- Change `.flow-nav-center-btn` to use `position: relative; top: -10px;` instead of `-mt-5` so it visually elevates without affecting the flex container's vertical alignment.

**Fix in `src/components/navigation/TabNavigation.tsx`:**
- Remove `safe-bottom` from the nav element. The `safe-area-inset-bottom` padding is already accounted for by the `bottom: 16px/24px` positioning, and it causes uneven top/bottom padding inside the bar.

### Issue 2 -- Quick Create popup positioning

The popup in `QuickCreateMenu.tsx` uses `fixed bottom-24` which is a hardcoded value that doesn't relate to the plus button's actual position.

**Fix in `src/components/QuickCreateMenu.tsx`:**
- Change the popup from `fixed bottom-24 left-1/2 -translate-x-1/2` to `fixed bottom-[90px] left-1/2 -translate-x-1/2` (or similar value) to position it just above the nav bar with a ~12px gap.
- The exact `bottom` value: nav bar is at `bottom: 24px`, bar height is roughly 56px, so popup bottom should be around `24 + 56 + 12 = 92px`. Use `bottom-[92px]` on desktop. Add a responsive adjustment for mobile where nav is at `bottom: 16px` (so `bottom-[84px]`).

### Technical details

**File 1: `src/index.css`**

In `.flow-nav-center-btn` (line 216), replace `-mt-5` with relative positioning:
```css
.flow-nav-center-btn {
  @apply flex items-center justify-center w-12 h-12 rounded-full;
  position: relative;
  top: -10px;
  background: #ffffff;
  color: #1C1C1E;
  box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.3);
}
```

**File 2: `src/components/navigation/TabNavigation.tsx`**

Remove `safe-bottom` from the nav className (line 23):
```tsx
<nav className="flow-nav-floating">
```

**File 3: `src/components/QuickCreateMenu.tsx`**

Change the popup container (line 57) positioning to sit just above the nav bar:
```tsx
<div className="fixed bottom-[92px] left-1/2 -translate-x-1/2 z-50 animate-spring-pop sm:bottom-[100px]">
```

### Summary
- 3 files changed
- Nav icons become vertically centered by switching from `-mt-5` (which affects flex layout) to `relative top` (which doesn't)
- Remove `safe-bottom` to eliminate uneven padding
- Quick Create popup repositioned to float centered above the nav bar
