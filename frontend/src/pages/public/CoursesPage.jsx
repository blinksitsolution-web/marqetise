import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Seo from '../../components/Seo'
import { EmptyState, Spinner } from '../../components/ui'
import { useSite } from '../../context/useSite'
import { api } from '../../services/api'
import { formatPrice } from '../../utils/format'

export default function CoursesPage() {
  const { site } = useSite()
  const [params, setParams] = useSearchParams()
  const [payload, setPayload] = useState(null)
  const [error, setError] = useState('')
  const hero = site?.blocks?.['courses.hero']?.payload
  const faqs = site?.faqs?.courses || []

  useEffect(() => {
    const query = params.toString()
    api.get(`/api/v1/courses${query ? `?${query}` : ''}`)
      .then((response) => setPayload(response.data))
      .catch(() => setError('Courses could not be loaded.'))
  }, [params])

  function update(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }

  const courses = payload?.data || []

  return (
    <>
      <Seo title="Courses" description={hero?.subcopy} path="/courses" />
      <section className="bg-navy-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="max-w-3xl text-4xl font-semibold sm:text-5xl">{hero?.headline || 'Learn digital marketing that you can use'}</h1>
          <p className="mt-4 max-w-2xl text-white/75">{hero?.subcopy}</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <form className="grid gap-3 rounded-3xl border border-line p-4 md:grid-cols-4" onSubmit={(event) => event.preventDefault()}>
          <label className="text-sm">Search
            <input className="mt-1 w-full rounded-xl border border-line px-3 py-2" value={params.get('search') || ''} onChange={(event) => update('search', event.target.value)} />
          </label>
          <label className="text-sm">Level
            <select className="mt-1 w-full rounded-xl border border-line px-3 py-2" value={params.get('level') || ''} onChange={(event) => update('level', event.target.value)}>
              <option value="">All</option>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </label>
          <label className="text-sm">Sort
            <select className="mt-1 w-full rounded-xl border border-line px-3 py-2" value={params.get('sort') || ''} onChange={(event) => update('sort', event.target.value)}>
              <option value="">Newest</option>
              <option value="title">Title</option>
              <option value="price">Price</option>
            </select>
          </label>
          <button type="button" className="self-end rounded-full border border-line px-4 py-2 text-sm" onClick={() => setParams(new URLSearchParams())}>Clear</button>
        </form>

        {error ? <p className="mt-6 text-red-700" role="alert">{error}</p> : null}
        {!payload && !error ? <div className="mt-8"><Spinner label="Loading courses" /></div> : null}
        {payload && courses.length === 0 ? (
          <div className="mt-8">
            <EmptyState title="No courses match" body="Try a different search, or check back when a course is published." />
          </div>
        ) : null}
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <article key={course.id} className="flex flex-col rounded-3xl bg-navy-900 p-6 text-white">
              <p className="text-xs uppercase tracking-wide text-white/50">{course.category}</p>
              <h2 className="mt-2 text-2xl font-semibold">{course.title}</h2>
              <p className="mt-3 flex-1 text-sm text-white/70">{course.summary}</p>
              <p className="mt-4 text-sm text-white/60">{course.duration_label} · {course.level}</p>
              <div className="mt-5 flex items-center justify-between">
                <span className="font-semibold text-white">{formatPrice(course)}</span>
                <Link to={`/courses/${course.slug}`} className="text-sm font-semibold">View details</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      {faqs.length ? (
        <section className="bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-3xl font-semibold">Questions</h2>
            <div className="mt-6 space-y-3">
              {faqs.map((faq) => (
                <details key={faq.question} className="rounded-2xl bg-white p-5">
                  <summary className="cursor-pointer font-semibold">{faq.question}</summary>
                  <p className="mt-2 text-sm text-muted">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  )
}
