import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Seo from '../../components/Seo'
import { Spinner } from '../../components/ui'
import { api } from '../../services/api'
import NotFoundPage from './NotFoundPage'

export default function CmsPage() {
  const { slug } = useParams()
  const [page, setPage] = useState(null)
  const [missing, setMissing] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    setPage(null)
    setMissing(false)
    setLoadError('')
    api.get(`/api/v1/pages/${slug}`)
      .then((response) => setPage(response.data.data))
      .catch((error) => {
        if (error?.response?.status === 404) setMissing(true)
        else setLoadError('The page could not be loaded.')
      })
  }, [slug])

  if (loadError) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center"><p className="text-red-700" role="alert">{loadError}</p></div>
  }

  if (missing) return <NotFoundPage />

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
