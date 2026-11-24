import { CheckCircle2, X } from 'lucide-react';

interface ToastBannerProps {
  message: string | null;
  onDismiss: () => void;
}

export function ToastBanner({ message, onDismiss }: ToastBannerProps) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-[#302027] bg-[#15151C]/95 px-4 py-3 text-sm text-[#F4F0EF] shadow-xl backdrop-blur-md"
      style={{
        boxShadow: '0 10px 30px -10px var(--accent-glow)',
      }}
    >
      <CheckCircle2
        className="h-4 w-4 shrink-0"
        style={{ color: 'var(--accent-highlight)' }}
      />
      <span className="max-w-xs sm:max-w-sm leading-snug">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="rounded p-1 text-[#85818A] hover:text-[#F4F0EF] transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
