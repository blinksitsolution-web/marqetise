const hosts = new Set(['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com'])

export function youtubeEmbed(value) {
  const raw = String(value || '').trim()
  if (!raw || /[\s\\]/.test(raw)) return ''
  let url
  try {
    url = new URL(raw)
  } catch {
    return ''
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return ''
  const host = url.hostname.replace(/^www\./, '').toLowerCase()
  let id = ''
  if (host === 'youtu.be') {
    id = url.pathname.split('/').filter(Boolean)[0] || ''
  } else if (hosts.has(host)) {
    const parts = url.pathname.split('/').filter(Boolean)
    if (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live') id = parts[1] || ''
    else if (parts[0] === 'watch') id = url.searchParams.get('v') || ''
  } else {
    return ''
  }
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return ''
  return `https://www.youtube.com/embed/${id}`
}

export function isUploadedVideo(value) {
  return typeof value === 'string' && /\/media\/\d+-[a-f0-9]{64}\.(mp4|webm|mov)(?:$|\?)/i.test(value)
}
