import { CheckCircle } from 'lucide-react';

const UpgradeSuccess = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-foreground">You're all set! 🎉</h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Welcome to Planisa Pro. Your account has been upgraded. You can now close this window and go back to the app.
          </p>
        </div>

        <a
          href="https://my.planisa.app/"
          className="mt-2 w-full py-3.5 rounded-2xl bg-foreground text-background text-[15px] font-semibold text-center active:scale-[0.98] transition-transform"
        >
          Close this window and return to Planisa
        </a>
      </div>
    </div>
  );
};

export default UpgradeSuccess;
