import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import Seo from '../../components/Seo'
import { Spinner } from '../../components/ui'
import { useKeyedState } from '../../hooks/useKeyedState'
import { api } from '../../services/api'

export default function ServiceDetailPage() {
  const { slug } = useParams()
  const [state, setState] = useKeyedState(slug, () => ({ service: null, missing: false, error: '' }))
  const { service, missing, error } = state

  useEffect(() => {
    let active = true
    api.get(`/api/v1/services/${slug}`)
      .then((response) => {
        if (active) setState((current) => ({ ...current, service: response.data.data }))
      })
      .catch((loadError) => {
        if (!active) return
        if (loadError?.response?.status === 404) setState((current) => ({ ...current, missing: true }))
        else setState((current) => ({ ...current, error: 'The service could not be loaded.' }))
      })
    return () => {
      active = false
    }
  }, [slug, setState])

  if (error) return <p className="mx-auto max-w-3xl px-4 py-16 text-red-700" role="alert">{error}</p>
  if (missing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-semibold">Service not found</h1>
        <Link to="/services" className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-blue">All services</Link>
      </div>
    )
  }
  if (!service) return <div className="px-4 py-16"><Spinner label="Loading service" /></div>

  return (
    <>
      <Seo title={service.name} description={service.summary} path={`/services/${service.slug}`} />
      <article className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-text">Service</p>
        <h1 className="mt-3 text-4xl font-semibold">{service.name}</h1>
        {service.summary ? <p className="mt-4 text-lg text-muted">{service.summary}</p> : null}
        {service.description ? <p className="mt-6 whitespace-pre-line text-sm leading-7">{service.description}</p> : null}
        <Link to={`/book/${service.slug}`} className="mt-8 inline-flex min-h-11 items-center rounded-full bg-blue px-5 text-sm font-semibold text-white">Book this service</Link>
      </article>
    </>
  )
}
