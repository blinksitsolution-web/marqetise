export function hasPublishedPage(site, slug) {
  const pages = site?.pages
  const list = Array.isArray(pages) ? pages : []

  return list.some((page) => page?.slug === slug)
}
