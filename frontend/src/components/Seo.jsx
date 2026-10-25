import { useEffect } from 'react'
import { useSite } from '../context/useSite'

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
  const { site } = useSite()
  const settings = site?.settings || {}

  useEffect(() => {
    const siteName = settings.company_name || 'Marqetise'
    const fallbackDescription = settings.meta_description || 'Digital marketing services and training from Marqetise.'
    const resolvedDescription = description || fallbackDescription
    document.title = title ? `${title} · ${siteName}` : (settings.meta_title || siteName)
    const url = `${window.location.origin}${path}`
    upsertMeta('name', 'description', resolvedDescription)
    upsertMeta('name', 'robots', robots)
    upsertMeta('property', 'og:title', document.title)
    upsertMeta('property', 'og:description', resolvedDescription)
    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:url', url)
    if (typeof settings.logo_url === 'string' && (settings.logo_url.startsWith('https://') || (settings.logo_url.startsWith('/') && !settings.logo_url.startsWith('//')))) {
      const image = settings.logo_url.startsWith('https://') ? settings.logo_url : `${window.location.origin}${settings.logo_url}`
      upsertMeta('property', 'og:image', image)
    }
    let canonical = document.head.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', url)
  }, [title, description, path, robots, settings.company_name, settings.meta_title, settings.meta_description, settings.logo_url])

  return null
}
