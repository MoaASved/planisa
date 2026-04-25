# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server on port 8080
npm run build     # Production build
npm run build:dev # Development build
npm run lint      # ESLint
npm run preview   # Preview production build
```

No test runner is configured; Playwright is installed but tests don't appear to be set up yet.

## Architecture

**Planisa** is a task/calendar/notes management app built with React + TypeScript + Vite, backed by Supabase.

### State Management

All client state lives in a single **Zustand store** (`src/store/useAppStore.ts`). It holds tasks, events, notes, notebooks, categories, and folders, plus all CRUD operations. Changes to the store are written through to Supabase by calling the store's own mutators — never write to Supabase directly from components.

### Data Flow

`SupabaseSync.tsx` (rendered in `App.tsx`) watches for auth state and calls `loadAll()` / `subscribeAll()` on the store. The conversion between Supabase row shapes and in-memory domain objects lives in `src/lib/supabaseSync.ts` (`rowToTask`, `taskToRow`, etc.).

### Auth & Access Control

`src/contexts/AuthContext.tsx` exposes `session`, `user` (Supabase auth user), `userRecord` (row from `public.users`), and `hasFullAccess`. Full access requires an active subscription or being within the 14-day trial window. After the trial, only the Calendar and Profile tabs are visible.

### Key Files

| File | Purpose |
|---|---|
| `src/App.tsx` | Routing, providers, SupabaseSync mount |
| `src/pages/Index.tsx` | Main dashboard; controls `activeTab` for 5 views |
| `src/store/useAppStore.ts` | Single Zustand store for all app state |
| `src/contexts/AuthContext.tsx` | Auth session, user record, subscription check |
| `src/lib/supabaseSync.ts` | Row ↔ domain object conversion + realtime subscriptions |
| `src/types/index.ts` | All shared TypeScript types |
| `supabase/migrations/` | Database schema history |

### Directory Layout

```
src/
  components/
    auth/          # Auth forms
    calendar/      # Calendar view components
    modals/        # Create/edit modals (events, tasks, lists)
    notes/         # Notes and notebooks UI
    tasks/         # Task list, sections, subtask UI
    ui/            # shadcn-ui primitives (don't edit directly)
    views/         # Top-level view components (HomeView, CalendarView, etc.)
  contexts/        # AuthContext
  hooks/           # Custom React hooks (useLongPress, useHaptics, use-mobile, etc.)
  lib/             # supabaseSync, color utilities, media utils
  pages/           # Index (main), Auth, NotFound
  store/           # useAppStore (Zustand)
  types/           # index.ts with all domain types
```

### Styling & UI

- Tailwind CSS with a pastel 11-color system (coral, peach, amber, yellow, mint, teal, sky, lavender, rose, gray, stone) defined in `tailwind.config.ts`.
- Dark mode via the `dark` class.
- Custom animations: `fade-up`, `scale-in`, `slide-up`, `view-slide-left/right`, `view-zoom-in`.
- Import alias `@` → `src/`.

### TypeScript Config

Compiler is intentionally loose: `allowJs: true`, `noImplicitAny: false`. Don't tighten these without broader discussion.
