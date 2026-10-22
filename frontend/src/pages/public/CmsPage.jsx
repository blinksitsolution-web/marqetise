import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Seo from '../../components/Seo'
import { Spinner } from '../../components/ui'
import { api } from '../../services/api'

export default function CmsPage() {
  const { slug } = useParams()
  const [page, setPage] = useState(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    setPage(null)
    setMissing(false)
    api.get(`/api/v1/pages/${slug}`)
      .then((response) => setPage(response.data.data))
      .catch(() => setMissing(true))
  }, [slug])

  if (missing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <Link to="/" className="mt-6 inline-flex text-sm font-semibold text-blue">Back home</Link>
      </div>
    )
  }

  if (!page) return <div className="px-4 py-16"><Spinner label="Loading page" /></div>

  return (
    <>
      <Seo title={page.meta_title || page.title} description={page.meta_description || page.excerpt} path={`/${page.slug}`} />
      <article className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl font-semibold">{page.title}</h1>
        {page.excerpt ? <p className="mt-4 text-lg text-muted">{page.excerpt}</p> : null}
        <div className="mt-8 whitespace-pre-line text-sm leading-7">{page.body}</div>
      </article>
    </>
  )
}
