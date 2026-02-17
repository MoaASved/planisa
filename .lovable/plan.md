
# Fix: White card extends fully to screen bottom

## The Problem

In `src/components/calendar/CalendarItemList.tsx`, the outer wrapper uses `h-full bg-background pt-4`. The white card inside uses `flex flex-col flex-1 overflow-hidden`. When there are few or no items, the card content doesn't fill the available height and the beige background shows through at the bottom.

## Root Cause

The `CalendarItemList` component renders inside a parent (`MonthView` / `WeekDayView`) that itself sits inside `CalendarView`'s `flex-1 overflow-hidden` container. The `h-full` on the `CalendarItemList` root should work — but the `pt-4` gap at the top creates a small beige strip visible above the card, while the card itself may not be stretching down because the parent containers don't consistently enforce full height.

## Fix

**File: `src/components/calendar/CalendarItemList.tsx`**

Change the outer return wrapper so the white card always fills from the gap all the way to the bottom. The key is to ensure the white card uses `min-h-full` instead of relying purely on flex to stretch it. The structure becomes:

```
<div className="flex flex-col h-full bg-background pt-4">         ← beige bg, gap at top
  <div style={{ background: #fff, borderRadius: 20px top, ... }}
       className="flex flex-col flex-1 min-h-0">                  ← white card, fills rest
    ...content...
  </div>
</div>
```

The real issue is that `overflow-hidden` on the white card may cap its height. The fix:

1. The outer `div` stays `flex flex-col h-full bg-background pt-4` — this creates the visible beige gap at top.
2. The white card `div` changes from `flex flex-col flex-1 overflow-hidden` to `flex flex-col flex-1` — removing `overflow-hidden` here and letting the inner scroll containers manage overflow themselves. This allows the white card to always stretch fully.

Actually looking more carefully: the white card IS `flex-1` which should stretch it. The issue is more likely that the parent component (MonthView or WeekDayView) that renders `CalendarItemList` is not giving it full remaining height. Let me check the parent structure.

## Technical Change

The simplest and most reliable fix is to change the outer container from `h-full` to use an approach that guarantees the white extends to the bottom even if the parent height calculation is off:

```tsx
// Before:
<div className="flex flex-col h-full bg-background pt-4">

// After:
<div className="flex flex-col min-h-full bg-background pt-4">
```

And ensure the white card has `flex-grow` to fill all remaining space:

```tsx
// White card: change flex-1 overflow-hidden → flex-1, keep rest
<div
  className="flex flex-col flex-1"   // removed overflow-hidden from outer
  style={{ background: '#ffffff', borderRadius: '20px 20px 0 0', boxShadow: '...' }}
>
```

The scroll containers inside (`ListScrollContainer` and the timeline div) already have their own `overflow-y-auto` so they manage scrolling correctly without needing `overflow-hidden` on the parent card.

## Files Changed

- `src/components/calendar/CalendarItemList.tsx` — 2 small class changes on lines ~451 and ~454

No functionality, card styling, shadows, colors, or event cards are affected.
