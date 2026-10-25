import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Seo from '../../components/Seo'
import { Badge, EmptyState, Skeleton } from '../../components/ui'
import { statusTone } from '../../components/statusTone'
import { useAuth } from '../../context/useAuth'
import { api, can } from '../../services/api'
import { formatDate } from '../../utils/format'

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/v1/admin/dashboard').then((response) => setData(response.data.data)).catch(() => setError('The dashboard could not be loaded.'))
  }, [])

  if (!data && !error) return <Skeleton label="Loading dashboard" />

  const counts = data?.counts ?? {}
  const hasCount = (key) => Object.prototype.hasOwnProperty.call(counts, key)
  const hasBlock = (key) => data != null && Object.prototype.hasOwnProperty.call(data, key)
  const maxStudents = Math.max(...(data?.enrolment_trend || []).map((item) => item.students), 0)
  const cards = [
    ['Students', counts.students, '/admin/students', 'students'],
    ['Published courses', counts.published_courses, '/admin/courses', 'published_courses'],
    ['Users', counts.users, '/admin/users', 'users'],
    ['New inquiries', counts.new_inquiries, '/admin/inquiries', 'new_inquiries'],
  ].filter((card) => hasCount(card[3]))
  const cardPermissions = {
    students: 'students.view',
    published_courses: 'courses.view',
    users: 'users.view',
    new_inquiries: 'inquiries.view',
  }

  return (
    <>
      <Seo title="Dashboard" path="/admin" robots="noindex,nofollow" />
      <h1 className="text-2xl font-semibold">Welcome back, {user?.name?.split(' ')[0]}</h1>
      <p className="mt-1 text-sm text-muted">Counts come from the database.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          can(user, 'content.manage') ? ['New page', '/admin/cms/pages/new'] : null,
          can(user, 'inquiries.view') ? ['Review inquiries', '/admin/inquiries'] : null,
          can(user, 'bookings.view') ? ['Review bookings', '/admin/bookings'] : null,
          can(user, 'students.view') ? ['Students', '/admin/students'] : null,
        ].filter(Boolean).map(([label, href]) => (
          <Link key={href} to={href} className="inline-flex min-h-11 items-center rounded-full bg-white px-4 text-sm font-semibold text-blue">{label}</Link>
        ))}
      </div>
      {error ? <p className="mt-4 text-red-700" role="alert">{error}</p> : null}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, href, key]) => (
          <article key={key} className="rounded-2xl bg-white p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value ?? '—'}</p>
            {can(user, cardPermissions[key]) ? <Link to={href} className="mt-3 inline-flex text-sm font-semibold text-blue">Open</Link> : null}
          </article>
        ))}
      </div>
      {hasBlock('enrolment_trend') || hasBlock('course_enrolments') ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {hasBlock('enrolment_trend') ? (
            <section className="rounded-2xl bg-white p-5">
              <h2 className="font-semibold">New students, last 12 months</h2>
              {maxStudents === 0 ? <p className="mt-6 text-sm text-muted">No student records in this range.</p> : (
                <TrendChart points={data.enrolment_trend} maxStudents={maxStudents} />
              )}
            </section>
          ) : null}
          {hasBlock('course_enrolments') ? (
            <section className="rounded-2xl bg-white p-5">
              <h2 className="font-semibold">Students by course</h2>
              {data.course_enrolments.every((course) => course.students === 0) ? <p className="mt-6 text-sm text-muted">No course enrolments yet.</p> : (
                <ul className="mt-4 space-y-3">
                  {data.course_enrolments.map((course) => (
                    <li key={course.id} className="flex items-center justify-between text-sm">
                      <span>{course.title}</span>
                      <span className="font-semibold">{course.students}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
        </div>
      ) : null}
      {hasBlock('recent_inquiries') || hasBlock('upcoming_bookings') ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {hasBlock('recent_inquiries') ? (
            <RecordList title="Recent inquiries" rows={data.recent_inquiries} empty="No inquiries yet." hrefFor={(row) => `/admin/inquiries/${row.id}`} render={(row) => (
              <div className="flex items-center justify-between gap-3">
                <div><p className="font-medium">{row.name}</p><p className="text-xs text-muted">{row.subject}</p></div>
                <Badge tone={statusTone(row.status)}>{row.status}</Badge>
              </div>
            )} />
          ) : null}
          {hasBlock('upcoming_bookings') ? (
            <RecordList title="Upcoming bookings" rows={data.upcoming_bookings} empty="No upcoming bookings." hrefFor={(row) => `/admin/bookings/${row.id}`} render={(row) => (
              <div className="flex items-center justify-between gap-3">
                <div><p className="font-medium">{row.name}</p><p className="text-xs text-muted">{row.service_name} · {formatDate(row.preferred_date)} {row.preferred_time}</p></div>
                <Badge tone={statusTone(row.status)}>{row.status}</Badge>
              </div>
            )} />
          ) : null}
        </div>
      ) : null}
      {hasBlock('activity') ? (
        data.activity.length ? (
          <section className="mt-6 rounded-2xl bg-white p-5">
            <h2 className="font-semibold">Recent activity</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {data.activity.map((item) => <li key={item.id}>{item.actor || 'System'} · {item.action} · {formatDate(item.created_at)}</li>)}
            </ul>
          </section>
        ) : <div className="mt-6"><EmptyState title="No activity yet" body="Sensitive admin actions will be listed here for people who can view the audit log." /></div>
      ) : null}
    </>
  )
}

function TrendChart({ points, maxStudents }) {
  const width = 240
  const height = 80
  const step = points.length > 1 ? width / (points.length - 1) : width
  const coords = points.map((item, index) => {
    const x = index * step
    const y = height - ((item.students / maxStudents) * (height - 8)) - 4
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="mt-6">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full text-blue" role="img" aria-label="New students by month">
        <polyline fill="none" stroke="currentColor" strokeWidth="2" points={coords} />
      </svg>
      <ul className="mt-2 flex justify-between text-[10px] text-muted">
        {points.filter((_, index) => index % 2 === 0).map((item) => <li key={item.month}>{item.label} {item.students}</li>)}
      </ul>
    </div>
  )
}

function RecordList({ title, rows, empty, render, hrefFor }) {
  return (
    <section className="rounded-2xl bg-white p-5">
      <h2 className="font-semibold">{title}</h2>
      {!rows?.length ? <p className="mt-4 text-sm text-muted">{empty}</p> : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.id}>
              {hrefFor ? <Link to={hrefFor(row)} className="block rounded-xl hover:bg-surface">{render(row)}</Link> : render(row)}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
