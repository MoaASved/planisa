import { useRef, useCallback, useEffect } from 'react';

export function useAutoSave(onSave: () => void, delay = 1500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(onSave);

  // Keep saveRef pointing to latest onSave so closures are always fresh
  useEffect(() => {
    saveRef.current = onSave;
  });

  const trigger = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      saveRef.current();
    }, delay);
  }, [delay]);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      saveRef.current();
    }
  }, []);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // On unmount, flush any pending save
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        saveRef.current();
      }
    };
  }, []);

  return { trigger, flush, cancel };
}
