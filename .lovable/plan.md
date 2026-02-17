
# Fix: White Card Extends to Bottom of Screen

## Root Cause Analysis

There are two compounding issues causing the beige strip at the bottom:

**Issue 1 – CalendarView has a hard height cap:**
In `src/components/views/CalendarView.tsx` line 139, the outer wrapper is:
```
h-[calc(100vh-140px)]
```
This means the entire calendar — including the white card — is artificially capped and stops 140px before the bottom of the screen. Everything below that cap is beige background from the page.

**Issue 2 – White card can't stretch beyond its container:**
The `CalendarItemList` white card uses `flex-grow`, which only fills space *within* its parent. Since the parent is capped by the `h-[calc(100vh-140px)]` container, the white card stops there too, even if it has nothing to fill.

## The Fix

The correct approach is to stop capping the height and instead let the content scroll naturally, while ensuring the white card always covers the full remaining screen.

### Changes needed:

**1. `src/components/views/CalendarView.tsx`**

Change the outer wrapper from a fixed `h-[calc(100vh-140px)]` to a `min-h` approach that allows the white card to reach the bottom of the viewport:

```tsx
// Before:
<div className="flex flex-col h-[calc(100vh-140px)] overflow-x-hidden bg-background">

// After:
<div className="flex flex-col min-h-[calc(100vh-56px)] overflow-x-hidden bg-background">
```

(56px accounts for the tab navigation bar at the bottom)

**2. `src/components/calendar/CalendarItemList.tsx`**

The white card needs to use `min-h` calculated from the viewport rather than relying on flex to stretch it. The simplest reliable fix: instead of `flex-grow` on the white card, give it an explicit `min-h` that guarantees it covers to the bottom:

```tsx
// White card wrapper: add min-h to guarantee full coverage
<div
  className="flex flex-col flex-grow"
  style={{
    background: '#ffffff',
    borderRadius: '20px 20px 0 0',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
    minHeight: '100%',      // ← added
  }}
>
```

**3. `src/components/calendar/MonthView.tsx`** and **`src/components/calendar/WeekDayView.tsx`**

The lower section wrapper that contains `CalendarItemList` must also pass its full height down:

MonthView line 184:
```tsx
// Before:
<div className="flex-1 flex flex-col relative bg-background">

// After:
<div className="flex-1 flex flex-col relative bg-background overflow-hidden">
```

WeekDayView line 110:
```tsx
// Before:
<div className="flex-1 overflow-hidden relative bg-background">

// After:
<div className="flex-1 flex flex-col relative bg-background overflow-hidden">
```

## Summary of Files Changed

- `src/components/views/CalendarView.tsx` — fix root height cap (1 line)
- `src/components/calendar/CalendarItemList.tsx` — add `minHeight: '100%'` to white card style (1 line)
- `src/components/calendar/MonthView.tsx` — ensure lower section passes full height (1 line)
- `src/components/calendar/WeekDayView.tsx` — make lower section consistent with MonthView (1 line)

No visual styling changes — same beige gap, same white card, same shadows, same event cards.
