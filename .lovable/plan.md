
Smart List-kortet för "Today" använder färgen `sky` (pastel-sky), men i `ListDetailView` satte jag `text-sky-500` (Tailwind blå). Ska matcha exakt: `text-pastel-sky`.

### Fix
I `src/components/tasks/ListDetailView.tsx` rad ~174:

Ändra:
```tsx
<CalendarIcon className="w-5 h-5 text-sky-500" />
```
till:
```tsx
<CalendarIcon className="w-5 h-5 text-pastel-sky" />
```

Samma färg som i `SmartListCard` när `color="sky"`.

### Fil
- `src/components/tasks/ListDetailView.tsx`
