export default function Brand({ light = false, compact = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <img
        src="/images/mark.png"
        alt=""
        width="36"
        height="36"
        className={`h-9 w-9 rounded-lg object-contain ${light ? 'bg-white p-1' : 'bg-white/10 p-1'}`}
        onError={(event) => {
          const img = event.currentTarget
          if (img.dataset.fallback === '1') return
          img.dataset.fallback = '1'
          img.src = '/images/logo-black.png'
          img.classList.remove('w-9')
          img.classList.add('w-auto')
        }}
      />
      {compact ? null : (
        <span className={`text-lg font-semibold tracking-tight ${light ? 'text-ink' : 'text-white'}`}>
          marqetise
        </span>
      )}
    </span>
  )
}
