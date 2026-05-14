import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export function NisaAssistant() {
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    setLastMessage(localStorage.getItem('nisa_last_message'));
    setDismissed(!!localStorage.getItem(`nisa_dismissed_${new Date().toDateString()}`));
  }, []);

  return (
    <div className="px-3">
      <div className="rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] p-3">
        <div className="flex items-center gap-3">
          <img
            src="/nisa.png"
            alt="Nisa"
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              opacity: dismissed ? 0.55 : 1,
              transform: dismissed ? 'rotate(-8deg)' : 'rotate(-6deg)',
              transition: 'all 0.3s ease',
              flexShrink: 0,
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              {dismissed ? 'Quiet for today' : 'Nisa'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {dismissed ? 'Tap to see message' : 'Your assistant'}
            </p>
          </div>
          <button
            onClick={() => setShowMessage(v => !v)}
            className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0"
          >
            <ChevronDown
              className={cn('w-3 h-3 text-muted-foreground transition-transform duration-200', showMessage && 'rotate-180')}
            />
          </button>
        </div>
        {showMessage && (
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-xs text-foreground leading-relaxed">
              {lastMessage ?? <span className="italic text-muted-foreground">No message yet...</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
