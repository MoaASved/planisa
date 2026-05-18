import { useState, useEffect, useRef } from 'react';
import { CheckSquare, FileText, Calendar, Share, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { supabase } from '@/integrations/supabase/client';
import { pastelColors, getColorBgClass } from '@/lib/colors';
import { PastelColor } from '@/types';

interface OnboardingFlowProps {
  onComplete: (name: string) => void;
}

function NisaImage({ step, fading }: { step: number; fading: boolean }) {
  const animMap: Record<number, string> = {
    1: 'nisa-float',
    2: 'nisa-nod',
    3: 'nisa-curious',
    4: 'nisa-excited',
    5: 'nisa-celebrate',
    6: 'nisa-float',
  };
  const rotateMap: Record<number, string> = {
    1: '-8deg',
    2: '0deg',
    3: '10deg',
    4: '-6deg',
    5: '0deg',
    6: '-8deg',
  };

  return (
    <img
      src="/nisa.png"
      alt="NISA"
      className={cn('transition-opacity duration-200 flex-shrink-0', fading && 'opacity-0')}
      style={{
        width: 120,
        height: 120,
        objectFit: 'contain',
        borderRadius: 20,
        boxShadow: '0 10px 36px rgba(0,0,0,0.13)',
        transform: `rotate(${rotateMap[step]})`,
        animation: `${animMap[step]} 2.6s ease-in-out infinite`,
      }}
    />
  );
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { addNote, updateSettings } = useAppStore();

  // Detect standalone (already installed as PWA) — computed once
  const [showInstallStep] = useState(() =>
    !(window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true)
  );
  const firstStep = 1;
  const totalSteps = showInstallStep ? 6 : 5;
  const lastStep = showInstallStep ? 6 : 5;

  // Device type for install instructions
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);
  const deviceType: 'ios' | 'android' | 'desktop' = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';

  const [step, setStep] = useState(firstStep);
  const [fading, setFading] = useState(false);
  const [name, setName] = useState('');
  const [stickyText, setStickyText] = useState('');
  const [stickyColor, setStickyColor] = useState<PastelColor>('honey');
  const [saving, setSaving] = useState(false);
  // Fixed random rotation between 2° and 4°, chosen once on mount
  const [rotation] = useState(() => 2 + Math.random() * 2);

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
          color: stickyColor,
          tags: [],
          isPinned: false,
          showInCalendar: false,
          hideFromAllNotes: false,
          hideDate: false,
        });
      }
    }

    if (step === lastStep) {
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
    step === lastStep ? (showInstallStep ? 'Done' : 'Start using Planisa') :
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

      {/* Vertically centered main body */}
      <div className="flex-1 w-full max-w-sm flex flex-col items-center justify-center px-8 gap-8"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <NisaImage step={step} fading={fading} />

        {/* Step content */}
        <div
          className={cn(
            'w-full flex flex-col items-center gap-3 transition-opacity duration-200',
            fading && 'opacity-0'
          )}
        >
          {step === 6 && (
            <>
              <h1 className="text-[26px] font-semibold tracking-tight text-center text-foreground">
                Add Planisa to your home screen
              </h1>
              <p className="text-[15px] text-center text-muted-foreground leading-relaxed">
                For the best experience, install Planisa as an app on your device.
              </p>
              <div className="w-full mt-3 bg-secondary rounded-2xl px-4 py-4 flex items-start gap-3">
                {deviceType === 'ios' && (
                  <>
                    <Share className="w-5 h-5 text-foreground/60 flex-shrink-0 mt-0.5" />
                    <p className="text-[14px] text-foreground/80 leading-relaxed">
                      Tap the share icon at the bottom of your browser, then tap <span className="font-medium">Add to Home Screen</span>.
                    </p>
                  </>
                )}
                {deviceType === 'android' && (
                  <>
                    <MoreVertical className="w-5 h-5 text-foreground/60 flex-shrink-0 mt-0.5" />
                    <p className="text-[14px] text-foreground/80 leading-relaxed">
                      Tap the menu icon in the top right of your browser, then tap <span className="font-medium">Add to Home Screen</span>.
                    </p>
                  </>
                )}
                {deviceType === 'desktop' && (
                  <p className="text-[14px] text-foreground/80 leading-relaxed">
                    Click the install icon in your browser's address bar to install Planisa.
                  </p>
                )}
              </div>
              <p className="text-[13px] text-center text-muted-foreground/60 leading-relaxed mt-1">
                Once added, open Planisa from your home screen. You'll already be signed in.
              </p>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="text-[26px] font-semibold tracking-tight text-center text-foreground">
                Welcome to Planisa
              </h1>
              <p className="text-[15px] text-center text-muted-foreground leading-relaxed">
                Hey! I'm NISA, I'll help you stay on top of everything. Let's get you set up.
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-[26px] font-semibold tracking-tight text-center text-foreground">
                Everything in one place
              </h1>
              <p className="text-[15px] text-center text-muted-foreground leading-relaxed">
                Planisa is your space for tasks, notes, and calendar, all in one place. Powerful but never overwhelming.
              </p>
              <div className="flex items-start gap-8 mt-4">
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
              <p className="text-[15px] text-center text-muted-foreground leading-relaxed">
                What should I call you?
              </p>
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && goNext()}
                placeholder="Your name"
                className="w-full mt-3 px-4 py-3.5 rounded-2xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground/40 text-[15px] outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow"
              />
            </>
          )}

          {step === 4 && (
            <>
              <h1 className="text-[26px] font-semibold tracking-tight text-center text-foreground">
                Let's create something
              </h1>
              <p className="text-[15px] text-center text-muted-foreground leading-relaxed">
                Create your first sticky note.<br />
                Add anything, a thought, a reminder, something you don't want to forget.
              </p>
              {/* Sticky note — matches StickyNoteCard exactly */}
              <div
                className={cn(
                  'w-full mt-3 rounded-2xl p-4 relative overflow-hidden',
                  getColorBgClass(stickyColor)
                )}
                style={{
                  transform: `rotate(${rotation.toFixed(2)}deg)`,
                  boxShadow: '2px 3px 8px rgba(0,0,0,0.08)',
                  minHeight: 130,
                }}
              >
                {/* Folded corner — same as StickyNoteCard */}
                <div className="absolute top-0 right-0 w-6 h-6 bg-gradient-to-br from-white/30 to-transparent rounded-bl-xl" />
                <div className="absolute top-0 right-0 w-0 h-0 border-l-[12px] border-l-transparent border-t-[12px] border-t-black/5" />
                <textarea
                  ref={stickyRef}
                  value={stickyText}
                  onChange={e => setStickyText(e.target.value)}
                  placeholder="Write something..."
                  rows={4}
                  className="w-full bg-transparent border-0 outline-none resize-none text-sm font-medium text-[#2C2C2A] placeholder:text-[#2C2C2A]/35 leading-relaxed"
                />
              </div>

              {/* Color picker dots */}
              <div className="flex items-center gap-2 mt-4">
                {pastelColors.map(({ value }) => (
                  <button
                    key={value}
                    onClick={() => setStickyColor(value)}
                    className={cn(
                      'rounded-full transition-all duration-150',
                      getColorBgClass(value),
                      stickyColor === value
                        ? 'w-5 h-5 ring-2 ring-foreground/25 ring-offset-1 ring-offset-background'
                        : 'w-4 h-4 opacity-60'
                    )}
                  />
                ))}
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h1 className="text-[26px] font-semibold tracking-tight text-center text-foreground">
                {displayName ? `You're all set, ${displayName}!` : "You're all set!"}
              </h1>
              <p className="text-[15px] text-center text-muted-foreground leading-relaxed">
                I'll be here if you need me.
              </p>
            </>
          )}
        </div>
      </div>

      {/* CTA + dots — always pinned at bottom */}
      <div
        className={cn(
          'w-full max-w-sm px-8 flex flex-col items-center gap-5 flex-shrink-0 transition-opacity duration-200',
          fading && 'opacity-0'
        )}
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)', marginBottom: 8 }}
      >
        <button
          onClick={goNext}
          disabled={saving}
          className="w-full py-4 rounded-2xl bg-foreground text-background text-[15px] font-semibold tracking-tight active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          {ctaLabel}
        </button>

        {step === 6 && (
          <button
            onClick={goNext}
            className="-mt-2 text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            Skip
          </button>
        )}

        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }, (_, i) => i + firstStep).map(i => (
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
