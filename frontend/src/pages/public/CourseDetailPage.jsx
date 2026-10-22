import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Seo from '../../components/Seo'
import { Spinner } from '../../components/ui'
import { api } from '../../services/api'
import { formatDate, formatPrice } from '../../utils/format'

export default function CourseDetailPage() {
  const { slug } = useParams()
  const [course, setCourse] = useState(null)
  const [related, setRelated] = useState([])
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    setCourse(null)
    setMissing(false)
    api.get(`/api/v1/courses/${slug}`)
      .then((response) => {
        setCourse(response.data.data)
        setRelated(response.data.related?.data || response.data.related || [])
      })
      .catch(() => setMissing(true))
  }, [slug])

  if (missing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-semibold">We could not find that course</h1>
        <p className="mt-3 text-muted">It may be unpublished or the address has changed.</p>
        <Link to="/courses" className="mt-6 inline-flex rounded-full bg-blue px-5 py-3 text-sm font-semibold text-white">Back to courses</Link>
      </div>
    )
  }

  if (!course) return <div className="px-4 py-16"><Spinner label="Loading course" /></div>

  return (
    <>
      <Seo title={course.title} description={course.summary} path={`/courses/${course.slug}`} />
      <section className="bg-navy-950 px-4 py-14 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.4fr_.8fr]">
          <div>
            <p className="text-sm text-white/60"><Link to="/courses">Courses</Link> / {course.category}</p>
            <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">{course.title}</h1>
            <p className="mt-4 max-w-2xl text-white/75">{course.summary}</p>
          </div>
          <aside className="rounded-3xl bg-white p-6 text-ink">
            <p className="text-3xl font-semibold text-brand">{formatPrice(course)}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-muted">Level</dt><dd>{course.level}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Duration</dt><dd>{course.duration_label || '—'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Format</dt><dd>{course.format}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Next start</dt><dd>{formatDate(course.next_start_date)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Certificate</dt><dd>{course.certificate_included ? 'Included' : 'Not included'}</dd></div>
            </dl>
            <Link to={`/contact?type=course&course=${course.id}&subject=${encodeURIComponent(course.title)}`} className="mt-6 block rounded-full bg-brand px-4 py-3 text-center text-sm font-semibold text-white">Enquire now</Link>
            <p className="mt-3 text-xs text-muted">An enquiry asks the team to contact you. It does not take payment or reserve a place.</p>
          </aside>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1.4fr_.8fr]">
        <div>
          <h2 className="text-2xl font-semibold">Overview</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted">{course.description}</p>
          {course.outcomes?.length ? (
            <ul className="mt-6 space-y-2 text-sm">
              {course.outcomes.map((outcome) => <li key={outcome} className="rounded-xl bg-surface px-4 py-3">{outcome}</li>)}
            </ul>
          ) : null}
          <h2 className="mt-10 text-2xl font-semibold">Curriculum</h2>
          <div className="mt-4 space-y-3">
            {(course.modules || []).map((module) => (
              <article key={module.id || module.title} className="rounded-2xl border border-line p-4">
                <h3 className="font-semibold">{module.title}</h3>
                <ul className="mt-2 list-disc pl-5 text-sm text-muted">
                  {(module.lessons || []).map((lesson) => <li key={lesson}>{lesson}</li>)}
                </ul>
              </article>
            ))}
          </div>
          {course.instructor_name ? (
            <div className="mt-10 rounded-2xl bg-surface p-5">
              <h2 className="text-xl font-semibold">{course.instructor_name}</h2>
              <p className="text-sm text-muted">{course.instructor_title}</p>
              <p className="mt-2 text-sm">{course.instructor_bio}</p>
            </div>
          ) : null}
        </div>
      </section>
      {related.length ? (
        <section className="bg-surface px-4 py-14">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold">You may also like</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {related.map((item) => (
                <Link key={item.id} to={`/courses/${item.slug}`} className="rounded-3xl bg-navy-900 p-5 text-white">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-brand">{formatPrice(item)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  )
}
