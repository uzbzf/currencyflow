import { CheckCircle2, XCircle } from 'lucide-react'

export function Toast({ toast }) {
  if (!toast) return null

  const isError = toast.type === 'error'

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-50 flex justify-center px-4 animate-toast-in"
    >
      <div
        className={`inline-flex max-w-sm items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur ${
          isError
            ? 'border-red-500/30 bg-red-500/95 text-white'
            : 'border-accent/30 bg-surface-elevated/95 text-ink'
        }`}
      >
        {isError ? (
          <XCircle className="h-4 w-4 shrink-0" />
        ) : (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
        )}
        <span>{toast.message}</span>
      </div>
    </div>
  )
}
