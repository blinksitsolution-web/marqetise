export default function Brand({ light = false, compact = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <img
        src="/brand/mark.png"
        alt=""
        className={`h-9 w-9 rounded-lg object-cover ${light ? 'bg-black' : 'mix-blend-screen'}`}
      />
      {compact ? null : (
        <span className={`text-lg font-semibold tracking-tight ${light ? 'text-ink' : 'text-white'}`}>
          marqetise
        </span>
      )}
    </span>
  )
}
