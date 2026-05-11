import { useState, useEffect, useRef } from 'react';
import { CheckSquare, FileText, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingFlowProps {
  onComplete: (name: string) => void;
}

const TOTAL_STEPS = 5;

function NisaImage({ step, fading }: { step: number; fading: boolean }) {
  const animMap: Record<number, string> = {
    1: 'nisa-float',
    2: 'nisa-nod',
    3: 'nisa-curious',
    4: 'nisa-excited',
    5: 'nisa-celebrate',
  };
  const rotateMap: Record<number, string> = {
    1: '-8deg',
    2: '0deg',
    3: '10deg',
    4: '-6deg',
    5: '0deg',
  };

  return (
    <img
      src="/nisa.png"
      alt="NISA"
      className={cn('transition-opacity duration-200', fading && 'opacity-0')}
      style={{
        width: 130,
        height: 130,
        objectFit: 'contain',
        borderRadius: 22,
        boxShadow: '0 10px 36px rgba(0,0,0,0.13)',
        transform: `rotate(${rotateMap[step]})`,
        animation: `${animMap[step]} 2.6s ease-in-out infinite`,
      }}
    />
  );
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { addNote, updateSettings } = useAppStore();
  const [step, setStep] = useState(1);
  const [fading, setFading] = useState(false);
  const [name, setName] = useState('');
  const [stickyText, setStickyText] = useState('');
  const [saving, setSaving] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const stickyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (step === 3) setTimeout(() => nameRef.current?.focus(), 250);
    if (step === 4) setTimeout(() => stickyRef.current?.focus(), 250);
  }, [step]);

  const goNext = async () => {
    if (saving) return;

    if (step === 3) {
      const trimmed = name.trim();
      if (trimmed) {
        await supabase.auth.updateUser({ data: { display_name: trimmed } });
        updateSettings({ name: trimmed });
      }
    }

    if (step === 4) {
      if (stickyText.trim()) {
        addNote({
          title: '',
          content: stickyText.trim(),
          type: 'sticky',
          color: 'peach',
          tags: [],
          isPinned: false,
          showInCalendar: false,
          hideFromAllNotes: false,
          hideDate: false,
        });
      }
    }

    if (step === 5) {
      setSaving(true);
      await supabase.auth.updateUser({ data: { onboarding_completed: true } });
      onComplete(name.trim());
      return;
    }

    setFading(true);
    setTimeout(() => {
      setStep(s => s + 1);
      setFading(false);
    }, 200);
  };

  const ctaLabel =
    step === 1 ? "Let's go" :
    step === 4 ? 'Done' :
    step === 5 ? 'Start using Planisa' :
    'Next';

  const displayName = name.trim();

  return (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center overflow-hidden">
      <style>{`
        @keyframes nisa-float {
          0%, 100% { transform: rotate(-8deg) translateY(0px); }
          50% { transform: rotate(-8deg) translateY(-10px); }
        }
        @keyframes nisa-nod {
          0%, 100% { transform: rotate(0deg); }
          40% { transform: rotate(-3deg); }
          60% { transform: rotate(3deg); }
        }
        @keyframes nisa-curious {
          0%, 100% { transform: rotate(10deg); }
          50% { transform: rotate(6deg); }
        }
        @keyframes nisa-excited {
          0%, 100% { transform: rotate(-6deg) scale(1); }
          25% { transform: rotate(-11deg) scale(1.07); }
          75% { transform: rotate(-1deg) scale(0.95); }
        }
        @keyframes nisa-celebrate {
          0%, 100% { transform: rotate(0deg) translateY(0px); }
          25% { transform: rotate(-5deg) translateY(-14px); }
          75% { transform: rotate(5deg) translateY(-7px); }
        }
      `}</style>

      {/* Top safe area spacer */}
      <div className="pt-safe h-16 flex-shrink-0" />

      {/* NISA */}
      <div className="flex-shrink-0 mt-4">
        <NisaImage step={step} fading={fading} />
      </div>

      {/* Content area */}
      <div
        className={cn(
          'flex-1 flex flex-col items-center px-8 pt-10 w-full max-w-sm transition-opacity duration-200',
          fading && 'opacity-0'
        )}
      >
        {step === 1 && (
          <>
            <h1 className="text-[26px] font-semibold tracking-tight text-center text-foreground">
              Welcome to Planisa
            </h1>
            <p className="mt-3 text-[15px] text-center text-muted-foreground leading-relaxed">
              Hey! I'm NISA, I'll help you stay on top of everything. Let's get you set up.
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-[26px] font-semibold tracking-tight text-center text-foreground">
              Everything in one place
            </h1>
            <p className="mt-3 text-[15px] text-center text-muted-foreground leading-relaxed">
              Planisa is your space for tasks, notes, and calendar — all in one place. Powerful but never overwhelming.
            </p>
            <div className="flex items-start gap-8 mt-8">
              {[
                { icon: CheckSquare, label: 'Tasks' },
                { icon: FileText, label: 'Notes' },
                { icon: Calendar, label: 'Calendar' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-[14px] bg-secondary flex items-center justify-center">
                    <Icon className="w-5 h-5 text-foreground/70" />
                  </div>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-[26px] font-semibold tracking-tight text-center text-foreground">
              First things first
            </h1>
            <p className="mt-3 text-[15px] text-center text-muted-foreground leading-relaxed">
              What should I call you?
            </p>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && goNext()}
              placeholder="Your name"
              className="w-full mt-6 px-4 py-3.5 rounded-2xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground/40 text-[15px] outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow"
            />
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="text-[26px] font-semibold tracking-tight text-center text-foreground">
              Let's create something
            </h1>
            <p className="mt-3 text-[15px] text-center text-muted-foreground leading-relaxed">
              Create your first sticky note. Add anything — a thought, a reminder, something you don't want to forget.
            </p>
            <div
              className="w-full mt-6 rounded-2xl p-4"
              style={{ background: 'hsl(var(--pastel-peach) / 0.3)', minHeight: 120 }}
            >
              <textarea
                ref={stickyRef}
                value={stickyText}
                onChange={e => setStickyText(e.target.value)}
                placeholder="Write something..."
                rows={4}
                className="w-full bg-transparent border-0 outline-none resize-none text-[15px] text-foreground placeholder:text-foreground/35 leading-relaxed"
              />
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h1 className="text-[26px] font-semibold tracking-tight text-center text-foreground">
              You're all set!
            </h1>
            <p className="mt-3 text-[15px] text-center text-muted-foreground leading-relaxed">
              {displayName
                ? `You're all set, ${displayName}! I'll be here if you need me.`
                : "You're all set! I'll be here if you need me."}
            </p>
          </>
        )}
      </div>

      {/* CTA + dots */}
      <div
        className={cn(
          'w-full max-w-sm px-8 flex flex-col items-center gap-5 pb-safe mb-10 flex-shrink-0 transition-opacity duration-200',
          fading && 'opacity-0'
        )}
      >
        <button
          onClick={goNext}
          disabled={saving}
          className="w-full py-4 rounded-2xl bg-foreground text-background text-[15px] font-semibold tracking-tight active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          {ctaLabel}
        </button>

        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(i => (
            <div
              key={i}
              className={cn(
                'rounded-full transition-all duration-300',
                i === step
                  ? 'w-5 h-[7px] bg-foreground'
                  : i < step
                  ? 'w-[7px] h-[7px] bg-foreground/40'
                  : 'w-[7px] h-[7px] bg-foreground/15'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
