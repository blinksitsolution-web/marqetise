import { useEffect } from 'react'

function upsertMeta(attribute, key, content) {
  if (!content) return
  let tag = document.head.querySelector(`meta[${attribute}="${key}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attribute, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

export default function Seo({ title, description, path = '/', robots = 'index,follow' }) {
  useEffect(() => {
    const siteName = 'Marqetise'
    document.title = title ? `${title} · ${siteName}` : siteName
    const url = `${window.location.origin}${path}`
    upsertMeta('name', 'description', description || 'Digital marketing services and training from Marqetise.')
    upsertMeta('name', 'robots', robots)
    upsertMeta('property', 'og:title', document.title)
    upsertMeta('property', 'og:description', description || '')
    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:url', url)
    let canonical = document.head.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', url)
  }, [title, description, path, robots])

  return null
}
