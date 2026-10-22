import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Seo from '../../components/Seo'
import { Badge, EmptyState, Spinner, statusTone } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { api, can } from '../../services/api'
import { formatDate } from '../../utils/format'

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/v1/admin/dashboard').then((response) => setData(response.data.data)).catch(() => setError('The dashboard could not be loaded.'))
  }, [])

  if (!data && !error) return <Spinner label="Loading dashboard" />

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
                <div className="mt-6 flex h-40 items-end gap-2">
                  {data.enrolment_trend.map((item) => (
                    <div key={item.month} className="flex flex-1 flex-col items-center gap-2">
                      <div className="w-full rounded-t-lg bg-blue" style={{ height: `${Math.max(8, (item.students / maxStudents) * 100)}%` }} title={`${item.students} students`} />
                      <span className="text-[10px] text-muted">{item.label}</span>
                    </div>
                  ))}
                </div>
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
            <RecordList title="Recent inquiries" rows={data.recent_inquiries} empty="No inquiries yet." render={(row) => (
              <div className="flex items-center justify-between gap-3">
                <div><p className="font-medium">{row.name}</p><p className="text-xs text-muted">{row.subject}</p></div>
                <Badge tone={statusTone(row.status)}>{row.status}</Badge>
              </div>
            )} />
          ) : null}
          {hasBlock('upcoming_bookings') ? (
            <RecordList title="Upcoming bookings" rows={data.upcoming_bookings} empty="No upcoming bookings." render={(row) => (
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

function RecordList({ title, rows, empty, render }) {
  return (
    <section className="rounded-2xl bg-white p-5">
      <h2 className="font-semibold">{title}</h2>
      {!rows?.length ? <p className="mt-4 text-sm text-muted">{empty}</p> : <ul className="mt-4 space-y-3">{rows.map((row) => <li key={row.id}>{render(row)}</li>)}</ul>}
    </section>
  )
}
