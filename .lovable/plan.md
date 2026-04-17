
## Större färgcirkel för pinnade listor (matcha Priority/Today)

### Problem
Pinnade listors prick (3.5×3.5px i en 9×9 slot) ser för liten och felplacerad ut jämfört med Priority/Today som har en 9×9 färgad cirkel med ikon.

### Lösning
I `src/components/tasks/SmartListCard.tsx` — när `dotOnly` är aktivt, rendera samma `w-9 h-9 rounded-full`-cirkel som Priority/Today använder, men helfylld i pastellfärgen utan ikon.

Ersätt nuvarande:
```tsx
{showDot ? (
  <div className={cn('w-3.5 h-3.5 rounded-full', colors.dot)} />
) : (
  <div className={cn('w-9 h-9 rounded-full ...', colors.bg)}>
    {Icon && <Icon ... />}
  </div>
)}
```

Med:
```tsx
{showDot ? (
  <div className={cn('w-9 h-9 rounded-full', colors.dot)} />
) : (
  <div className={cn('w-9 h-9 rounded-full flex items-center justify-center', colors.bg)}>
    {Icon && <Icon className={cn('w-[18px] h-[18px]', colors.text)} />}
  </div>
)}
```

Yttre `w-9 h-9`-flex-slotten behålls → exakt samma placering som Priority/Today.

### Resultat
- Pinnade listor får en stor, helfärgad cirkel i samma storlek och position som Priority/Today.
- Mer balanserad visuell rytm i 2×2-rutnätet.

### Fil
- `src/components/tasks/SmartListCard.tsx`
