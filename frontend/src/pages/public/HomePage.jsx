import { Link } from 'react-router-dom'
import Seo from '../../components/Seo'
import { Spinner } from '../../components/ui'
import { useSite } from '../../context/SiteContext'
import { formatPrice } from '../../utils/format'

function items(block) {
  return block?.payload?.items || []
}

export default function HomePage() {
  const { site, error } = useSite()
  const blocks = site?.blocks || {}
  const hero = blocks['home.hero']?.payload
  const why = blocks['home.why']?.payload
  const process = blocks['home.process']?.payload
  const services = site?.services?.data || site?.services || []
  const courses = site?.featured_courses?.data || site?.featured_courses || []

  if (!site && !error) {
    return <div className="px-4 py-20"><Spinner label="Loading the homepage" /></div>
  }

  return (
    <>
      <Seo title="Home" description={hero?.subcopy} path="/" />
      <section className="overflow-hidden bg-navy-950 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-[1.1fr_.9fr] lg:py-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Marqetise</p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight sm:text-6xl">
              {hero?.headline || 'Marketing that grows your business and your skills'}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/75">{hero?.subcopy}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={hero?.primary_href || '/book'} className="inline-flex min-h-11 items-center rounded-full bg-brand px-5 text-lg font-bold text-ink">{hero?.primary_label || 'Book a strategy call'}</Link>
              <Link to={hero?.secondary_href || '/courses'} className="inline-flex min-h-11 items-center rounded-full border border-white/20 px-5 text-sm font-semibold">{hero?.secondary_label || 'Explore courses'}</Link>
            </div>
          </div>
          <div className="relative rounded-3xl border border-white/10 bg-navy-800 p-6">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full border border-brand/40" aria-hidden="true" />
            <p className="text-sm text-white/60">What we work on</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {items(blocks['home.focus']).map((item) => (
                <li key={item.title} className="rounded-2xl bg-white/5 px-4 py-5">
                  <p className="text-lg font-semibold">{item.title}</p>
                  {item.body ? <p className="mt-2 text-sm text-white/70">{item.body}</p> : null}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-white/55">Figures and client stories appear here only after they are published in the CMS.</p>
          </div>
        </div>
      </section>

      {items(blocks['home.stats']).length ? (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-2xl font-semibold">{blocks['home.stats']?.payload?.title || 'Results'}</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items(blocks['home.stats']).map((item) => (
              <li key={item.label || item.title} className="rounded-3xl border border-line p-5">
                <p className="text-3xl font-semibold">{item.value}</p>
                <p className="mt-2 text-sm text-muted">{item.label || item.title}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {error ? <p className="mx-auto max-w-6xl px-4 py-6 text-red-700" role="alert">{error}</p> : null}

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold">Services built to grow a business</h2>
          <div className="flex gap-4">
            <Link to="/services" className="text-sm font-semibold text-blue">All services</Link>
            <Link to="/book" className="text-sm font-semibold text-blue">Book a service</Link>
          </div>
        </div>
        {services.length === 0 ? <p className="mt-6 text-sm text-muted">Published services will appear here.</p> : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <article key={service.id} className="rounded-3xl border border-line bg-white p-6">
              <h3 className="text-xl font-semibold">{service.name}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{service.summary}</p>
              <Link to={`/book/${service.slug}`} className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-blue">Book this service</Link>
            </article>
          ))}
        </div>
        )}
      </section>

      {why ? (
        <section className="bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-3xl font-semibold">{why.title}</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {items(blocks['home.why']).map((item) => (
                <article key={item.title} className="rounded-3xl bg-white p-6">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl font-semibold">Featured courses</h2>
          <Link to="/courses" className="text-sm font-semibold text-blue">View all</Link>
        </div>
        {courses.length === 0 ? <p className="mt-6 text-sm text-muted">Published courses will appear here.</p> : (
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {courses.map((course) => (
              <article key={course.id} className="flex flex-col rounded-3xl bg-navy-900 p-6 text-white">
                <p className="text-sm text-white/60">{course.level} · {course.format}</p>
                <h3 className="mt-3 text-2xl font-semibold">{course.title}</h3>
                <p className="mt-3 flex-1 text-sm text-white/70">{course.summary}</p>
                <div className="mt-6 flex items-center justify-between">
                  <span className="font-semibold text-white">{formatPrice(course)}</span>
                  <Link to={`/courses/${course.slug}`} className="text-sm font-semibold">View details</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {process ? (
        <section className="bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-3xl font-semibold">{process.title}</h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-4">
              {items(blocks['home.process']).map((item, index) => (
                <li key={item.title} className="rounded-3xl bg-white p-5">
                  <span className="text-sm font-semibold text-blue">0{index + 1}</span>
                  <h3 className="mt-3 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted">{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-3xl bg-blue px-6 py-10 text-white sm:px-10">
          <h2 className="text-3xl font-semibold">Grow the business, or build the skill.</h2>
          <p className="mt-3 max-w-xl text-white/80">Talk to the team about a service, or look through the courses. Enrolment requests are reviewed by a person. They are not payments.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/contact" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-blue">Contact us</Link>
            <Link to="/courses" className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold">Explore courses</Link>
          </div>
        </div>
      </section>
    </>
  )
}
