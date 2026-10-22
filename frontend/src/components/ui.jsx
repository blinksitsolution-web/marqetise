export const inputClass = 'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-blue'

export function Field({ label, error, hint, children }) {
  return (
    <div className="text-sm">
      <label className="block">
        <span className="mb-1.5 block font-medium text-ink">{label}</span>
        {children}
      </label>
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
      {error ? <span className="mt-1 block text-sm text-red-700" role="alert">{error}</span> : null}
    </div>
  )
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-brand text-white hover:bg-brand-700',
    blue: 'bg-blue text-white hover:bg-blue-700',
    ghost: 'border border-white/20 bg-white/5 text-white hover:bg-white/10',
    outline: 'border border-line bg-white text-ink hover:bg-surface',
    danger: 'bg-red-700 text-white hover:bg-red-800',
  }

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Badge({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-surface text-ink',
    green: 'bg-emerald-50 text-emerald-800',
    orange: 'bg-orange-50 text-brand-700',
    red: 'bg-red-50 text-red-700',
    blue: 'bg-blue-50 text-blue',
  }

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>
}

export function statusTone(status) {
  if (['published', 'active', 'confirmed', 'resolved', 'completed'].includes(status)) return 'green'
  if (['pending', 'invited', 'in_progress', 'waitlist', 'draft'].includes(status)) return 'orange'
  if (['suspended', 'cancelled', 'withdrawn', 'archived'].includes(status)) return 'red'
  return 'blue'
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function Spinner({ label = 'Loading' }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand" />
      {label}
    </div>
  )
}

export function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/50 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" className="rounded-full px-2 py-1 text-sm text-muted" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Notice({ tone = 'info', children }) {
  const tones = {
    info: 'bg-blue-50 text-blue',
    success: 'bg-emerald-50 text-emerald-800',
    error: 'bg-red-50 text-red-800',
  }

  return <div className={`rounded-xl px-4 py-3 text-sm ${tones[tone]}`} role="status">{children}</div>
}
