

## Plan: Outside-klick stänger endast menyn (blockera andra klick)

### Problem
När menyn (tre prickar) är öppen i `ListDetailView` och användaren klickar utanför för att stänga den, triggas även det underliggande elementet (t.ex. en task öppnas, en knapp aktiveras). Det blir rörigt.

### Lösning
När menyn är öppen ska första outside-klick **endast** stänga menyn — inget annat ska reagera.

### Implementation i `src/components/tasks/ListDetailView.tsx`
- Byt nuvarande `mousedown`/`touchstart`-listeners (som låter eventet fortsätta till target) mot en **capture-fas** listener på `document` för `pointerdown` (eller `mousedown` + `touchstart` i capture)
- I handlern: om target ligger utanför både menyn och triggerknappen:
  - `e.preventDefault()`
  - `e.stopPropagation()` + `e.stopImmediatePropagation()`
  - `setShowMenu(false)`
- Capture-fas + stopPropagation hindrar att klicket når underliggande element
- För att även blockera den efterföljande `click`-eventet (som följer mousedown/touch) lägger vi till en engångs-`click` capture-listener som också preventDefault + stopPropagation, sedan tar bort sig själv
- Cleanup vid menystängning/unmount

### Fil
- `src/components/tasks/ListDetailView.tsx` (endast useEffect-blocket för outside-click uppdateras)

