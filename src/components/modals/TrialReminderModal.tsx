import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';

interface TrialReminderModalProps {
  isOpen: boolean;
  onUpgrade: () => void;
  onDismiss: () => void;
}

export function TrialReminderModal({ isOpen, onUpgrade, onDismiss }: TrialReminderModalProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      <style>{`
        @keyframes nisa-worried {
          0%, 100% { transform: rotate(-5deg) translateY(0px); }
          35%       { transform: rotate(-9deg) translateY(-4px); }
          65%       { transform: rotate(-2deg) translateY(-2px); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onClick={onDismiss}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div className="w-full max-w-sm bg-card rounded-3xl shadow-2xl animate-scale-in p-7 flex flex-col items-center gap-5 text-center">
          <img
            src="/nisa.png"
            alt={t('nisa.label')}
            style={{
              width: 80,
              height: 80,
              objectFit: 'contain',
              borderRadius: 16,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              animation: 'nisa-worried 3.2s ease-in-out infinite',
            }}
          />

          <div className="flex flex-col gap-2.5">
            <h2 className="text-xl font-semibold text-foreground leading-snug">
              {t('trialReminderModal.headline')}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('trialReminderModal.description')}
            </p>
          </div>

          <div className="w-full flex flex-col gap-3">
            <button
              onClick={onUpgrade}
              className="w-full py-3.5 rounded-2xl bg-foreground text-background text-[15px] font-semibold active:scale-[0.98] transition-transform"
            >
              {t('trialReminderModal.upgradeNow')}
            </button>
            <button
              onClick={onDismiss}
              className="text-sm text-muted-foreground/70 py-1 hover:text-muted-foreground transition-colors"
            >
              {t('trialReminderModal.maybeLater')}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
