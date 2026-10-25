import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Seo from '../../components/Seo'
import { EmptyState, Spinner } from '../../components/ui'
import { api } from '../../services/api'

function startingPrice(value) {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return ''
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function ServicesPage() {
  const [services, setServices] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/v1/services')
      .then((response) => setServices(response.data?.data || []))
      .catch(() => setError('Services could not be loaded.'))
  }, [])

  return (
    <>
      <Seo
        title="Services"
        description="Published services. A booking request is pending until a person confirms it."
        path="/services"
      />
      <section className="bg-navy-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="max-w-3xl text-4xl font-semibold sm:text-5xl">Services</h1>
          <p className="mt-4 max-w-2xl text-white/75">Published services. Choose one to request a booking. A request stays pending until someone confirms it.</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-10">
        {error ? <p className="text-red-700" role="alert">{error}</p> : null}
        {!services && !error ? <Spinner label="Loading services" /> : null}
        {services && services.length === 0 ? (
          <EmptyState title="No services are published" body="Services appear here after they are published in the admin." />
        ) : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(services || []).map((service) => {
            const price = startingPrice(service.starting_price)

            return (
              <article key={service.id} className="flex flex-col rounded-3xl border border-line bg-white p-6">
                <h2 className="text-2xl font-semibold">{service.name}</h2>
                <p className="mt-3 flex-1 text-sm leading-6 text-muted">{service.summary}</p>
                {service.description ? <p className="mt-3 text-sm leading-6 text-muted">{service.description}</p> : null}
                {service.duration_label ? <p className="mt-4 text-sm text-muted">{service.duration_label}</p> : null}
                {price ? <p className="mt-2 text-sm text-ink">Starting price {price}</p> : null}
                <div className="mt-5 flex gap-4">
                  <Link to={`/services/${service.slug}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-blue">View service</Link>
                  <Link to={`/book/${service.slug}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-blue">Book this service</Link>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </>
  )
}
