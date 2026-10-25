export default function Brand({ light = false, compact = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <img
        src="/brand/mark.png"
        alt=""
        width="36"
        height="36"
        className={`h-9 w-9 rounded-lg object-contain ${light ? 'bg-white p-1' : 'bg-white/10 p-1'}`}
      />
      {compact ? null : (
        <span className={`text-lg font-semibold tracking-tight ${light ? 'text-ink' : 'text-white'}`}>
          marqetise
        </span>
      )}
    </span>
  )
}
