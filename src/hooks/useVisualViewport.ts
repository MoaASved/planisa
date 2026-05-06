import { useState, useEffect } from 'react';

/**
 * Tracks the visual viewport so modals can stay visible above the keyboard.
 * On iOS/Android, when the soft keyboard opens the visual viewport shrinks;
 * position:fixed elements need to account for this to avoid being hidden behind it.
 */
export function useVisualViewport(topOffset = 70) {
  const compute = () => {
    const vv = window.visualViewport;
    const h = vv?.height ?? window.innerHeight;
    const ot = vv?.offsetTop ?? 0;
    return {
      modalTop: ot + topOffset,
      maxHeight: Math.max(280, h - topOffset - 20),
    };
  };

  const [state, setState] = useState(compute);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setState(compute());
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topOffset]);

  return state;
}
