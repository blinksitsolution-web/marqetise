function safeLogo(url) {
  if (typeof url !== 'string' || url === '') return '/brand/mark.png'
  if (url.startsWith('/') && !url.startsWith('//')) return url
  if (url.startsWith('https://')) return url
  return '/brand/mark.png'
}

export default function Brand({ light = false, compact = false, logoUrl = '' }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <img
        src={safeLogo(logoUrl)}
        alt=""
        width="36"
        height="36"
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
