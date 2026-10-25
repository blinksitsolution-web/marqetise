import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Seo from '../../components/Seo'
import { Badge, Button, EmptyState, Field, Modal, Notice, Pager, Skeleton, Spinner, inputClass } from '../../components/ui'
import { statusTone } from '../../components/statusTone'
import { useAuth } from '../../context/useAuth'
import { api, can, ensureCsrf, errorMessage } from '../../services/api'
import { formatDate } from '../../utils/format'

function useRows(path) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  useEffect(() => {
    api.get(path).then((response) => setRows(response.data)).catch(() => setError('The records could not be loaded.'))
  }, [path, version])
  return { rows, error, reload: () => setVersion((value) => value + 1) }
}

export function InquiriesPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const { rows, error } = useRows(`/api/v1/admin/inquiries?search=${encodeURIComponent(search)}&status=${status}`)
  const data = rows?.data || []

  return (
    <section>
      <Seo title="Inquiries" path="/admin/inquiries" robots="noindex,nofollow" />
      <h1 className="text-2xl font-semibold">Inquiries</h1>
      <div className="mt-4 flex gap-2">
        <input className={inputClass} aria-label="Search inquiries" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, or subject" />
        <select className={inputClass} aria-label="Inquiry status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All</option>
          <option value="new">New</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>
      {error ? <p className="mt-4 text-red-700">{error}</p> : null}
      {!rows ? (error ? null : <Skeleton label="Loading records" />) : data.length === 0 ? <div className="mt-6"><EmptyState title="No inquiries" body="Messages from the contact form will appear here." /></div> : (
        <div className="mt-4 overflow-x-auto rounded-2xl bg-white">
          <table className="record-table w-full text-left text-sm">
            <thead className="text-muted"><tr><th className="px-4 py-3">From</th><th>Subject</th><th>Status</th><th>Received</th><th /></tr></thead>
            <tbody>
              {data.map((inquiry) => (
                <tr key={inquiry.id} className="border-t border-line">
                  <td className="px-4 py-3" data-label="From"><p className="font-medium">{inquiry.name}</p><p className="text-xs text-muted">{inquiry.email}</p></td>
                  <td data-label="Subject">{inquiry.subject}</td>
                  <td data-label="Status"><Badge tone={statusTone(inquiry.status)}>{inquiry.status.replace('_', ' ')}</Badge></td>
                  <td data-label="Received">{formatDate(inquiry.created_at)}</td>
                  <td className="px-4 text-right" data-label=""><Link className="inline-flex min-h-11 items-center font-semibold text-blue" to={`/admin/inquiries/${inquiry.id}`}>Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export function InquiryDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [inquiry, setInquiry] = useState(null)
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function load() {
    api.get(`/api/v1/admin/inquiries/${id}`)
      .then((response) => setInquiry(response.data.data))
      .catch((loadError) => setError(errorMessage(loadError, 'The inquiry could not be loaded.')))
  }

  useEffect(load, [id])

  async function updateStatus(status) {
    setError('')
    try {
      await ensureCsrf()
      await api.patch(`/api/v1/admin/inquiries/${id}`, { status })
      load()
    } catch (saveError) {
      setError(errorMessage(saveError, 'The status was not saved.'))
    }
  }

  async function addNote(event) {
    event.preventDefault()
    setError('')
    try {
      await ensureCsrf()
      await api.post(`/api/v1/admin/inquiries/${id}/notes`, { body: note })
      setNote('')
      setMessage('Note saved. It is only visible to staff.')
      load()
    } catch (saveError) {
      setError(errorMessage(saveError, 'The note was not saved.'))
    }
  }

  async function createStudent() {
    setError('')
    try {
      await ensureCsrf()
      const response = await api.post(`/api/v1/admin/inquiries/${id}/student`)
      setMessage(response.data.created
        ? `Student record ${response.data.data.id} was created with waitlist status.`
        : `Student record ${response.data.data.id} was already created from this inquiry.`)
    } catch (saveError) {
      setError(errorMessage(saveError, 'The student record was not created.'))
    }
  }

  if (!inquiry && error) return <p className="text-red-700" role="alert">{error}</p>
  if (!inquiry) return <Spinner />

  return (
    <article className="space-y-4">
      <Seo title={inquiry.subject} path={`/admin/inquiries/${id}`} robots="noindex,nofollow" />
      <h1 className="text-2xl font-semibold">{inquiry.subject}</h1>
      {message ? <Notice tone="success">{message}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <p className="text-sm text-muted">{inquiry.name} · {inquiry.email} · {inquiry.type}</p>
      <p className="whitespace-pre-line rounded-2xl bg-white p-5">{inquiry.message}</p>
      {can(user, 'inquiries.manage') ? (
        <label className="block text-sm">Status
          <select className={`${inputClass} mt-1 max-w-xs`} value={inquiry.status} onChange={(event) => updateStatus(event.target.value)}>
            <option value="new">New</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>
      ) : null}
      <h2 className="font-semibold">Internal notes</h2>
      <ul className="space-y-2 text-sm">
        {(inquiry.notes || []).map((item) => <li key={item.id} className="rounded-xl bg-white p-3">{item.body}<span className="mt-1 block text-xs text-muted">{item.author} · {formatDate(item.created_at)}</span></li>)}
      </ul>
      {can(user, 'inquiries.manage') ? (
        <form className="space-y-3" onSubmit={addNote}>
          <textarea className={inputClass} value={note} onChange={(event) => setNote(event.target.value)} aria-label="Internal note" />
          <div className="flex gap-2">
            <Button type="submit" variant="blue">Add note</Button>
            {can(user, 'students.manage') ? <Button type="button" variant="outline" onClick={createStudent}>Create student</Button> : null}
          </div>
        </form>
      ) : null}
    </article>
  )
}

export function BookingsPage() {
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const params = new URLSearchParams({ page: String(page) })
  if (status) params.set('status', status)
  if (search.trim()) params.set('search', search.trim())
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const { rows, error, reload } = useRows(`/api/v1/admin/bookings?${params.toString()}`)
  const [selected, setSelected] = useState(null)
  const data = rows?.data || []

  function changeFilter(setter) {
    return (event) => {
      setter(event.target.value)
      setPage(1)
    }
  }

  const { user } = useAuth()
  const [saveError, setSaveError] = useState('')

  async function save(event) {
    event.preventDefault()
    setSaveError('')
    try {
      await ensureCsrf()
      await api.patch(`/api/v1/admin/bookings/${selected.id}`, {
        status: selected.status,
        internal_notes: selected.internal_notes,
        cancellation_reason: selected.cancellation_reason,
      })
      setSelected(null)
      reload()
    } catch (saveError) {
      setSaveError(errorMessage(saveError, 'The booking was not saved.'))
    }
  }

  return (
    <section>
      <Seo title="Bookings" path="/admin/bookings" robots="noindex,nofollow" />
      <h1 className="text-2xl font-semibold">Bookings</h1>
      <p className="text-sm text-muted">Requests stay pending until a staff member confirms them.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <input className={inputClass} aria-label="Search bookings" value={search} onChange={changeFilter(setSearch)} placeholder="Name, email, or reference" />
        <select className={inputClass} aria-label="Booking status" value={status} onChange={changeFilter(setStatus)}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input className={inputClass} aria-label="From date" type="date" value={from} onChange={changeFilter(setFrom)} />
        <input className={inputClass} aria-label="To date" type="date" value={to} onChange={changeFilter(setTo)} />
      </div>
      {error ? <p className="mt-4 text-red-700">{error}</p> : null}
      {!rows ? (error ? null : <Skeleton label="Loading records" />) : data.length === 0 ? <div className="mt-6"><EmptyState title="No bookings" body="Service requests from the public form will appear here." /></div> : (
        <div className="mt-4 overflow-x-auto rounded-2xl bg-white">
          <table className="record-table w-full text-left text-sm">
            <thead className="text-muted"><tr><th className="px-4 py-3">Reference</th><th>Client</th><th>When</th><th>Status</th><th /></tr></thead>
            <tbody>
              {data.map((booking) => (
                <tr key={booking.id} className="border-t border-line">
                  <td className="px-4 py-3" data-label="Reference">{booking.reference}<p className="text-xs text-muted">{booking.service_name}</p></td>
                  <td data-label="Client">{booking.name}</td>
                  <td data-label="When">{formatDate(booking.preferred_date)} {booking.preferred_time}</td>
                  <td data-label="Status"><Badge tone={statusTone(booking.status)}>{booking.status}</Badge></td>
                  <td className="px-4 text-right" data-label=""><button type="button" className="inline-flex min-h-11 items-center font-semibold text-blue" onClick={() => setSelected(booking)}>Review</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager meta={rows?.meta} onPage={setPage} />
      {selected ? (
        <Modal title={selected.reference} onClose={() => setSelected(null)}>
          <form className="space-y-3" onSubmit={save}>
            {saveError ? <Notice tone="error">{saveError}</Notice> : null}
            <p className="text-sm">{selected.goals}</p>
            <Field label="Status"><select className={inputClass} value={selected.status} onChange={(event) => setSelected({ ...selected, status: event.target.value })}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></Field>
            <Field label="Internal notes"><textarea className={inputClass} value={selected.internal_notes || ''} onChange={(event) => setSelected({ ...selected, internal_notes: event.target.value })} /></Field>
            <Field label="Cancellation reason"><input className={inputClass} value={selected.cancellation_reason || ''} onChange={(event) => setSelected({ ...selected, cancellation_reason: event.target.value })} /></Field>
            {can(user, 'bookings.manage') ? <Button type="submit" variant="blue">Save booking</Button> : <p className="text-sm text-muted">You can review this booking. Saving it needs the manage permission.</p>}
          </form>
        </Modal>
      ) : null}
    </section>
  )
}

export function StudentsPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [courses, setCourses] = useState([])
  const [form, setForm] = useState({ name: '', email: '', phone: '', status: 'waitlist', course_id: '', notes: '' })
  const { rows, error: loadError, reload } = useRows(`/api/v1/admin/students?search=${encodeURIComponent(search)}`)

  useEffect(() => {
    if (!can(user, 'students.manage')) return
    api.get('/api/v1/admin/courses?per_page=100').then((response) => setCourses(response.data.data || [])).catch(() => setCourses([]))
  }, [user])
  const data = rows?.data || []

  async function create(event) {
    event.preventDefault()
    setError('')
    try {
      await ensureCsrf()
      await api.post('/api/v1/admin/students', { ...form, phone: form.phone || null, notes: form.notes || null, course_id: form.course_id ? Number(form.course_id) : null })
      setOpen(false)
      reload()
    } catch (saveError) {
      setError(errorMessage(saveError))
    }
  }

  return (
    <section>
      <Seo title="Students" path="/admin/students" robots="noindex,nofollow" />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Students</h1>
        {can(user, 'students.manage') ? <Button variant="blue" onClick={() => setOpen(true)}>Add student</Button> : null}
      </div>
      <input className={`${inputClass} mt-4 max-w-sm`} aria-label="Search students" value={search} onChange={(event) => setSearch(event.target.value)} />
      {loadError ? <p className="mt-4 text-red-700" role="alert">{loadError}</p> : null}
      {!rows ? (loadError ? null : <Skeleton label="Loading records" />) : data.length === 0 ? <div className="mt-6"><EmptyState title="No students" body="Student records are created by staff. The public site does not create them automatically." /></div> : (
        <div className="mt-4 overflow-x-auto rounded-2xl bg-white">
          <table className="record-table w-full text-left text-sm">
            <thead className="text-muted"><tr><th className="px-4 py-3">Student</th><th>Course</th><th>Status</th><th /></tr></thead>
            <tbody>
              {data.map((student) => (
                <tr key={student.id} className="border-t border-line">
                  <td className="px-4 py-3" data-label="Student"><p className="font-medium">{student.name}</p><p className="text-xs text-muted">{student.email}</p></td>
                  <td data-label="Course">{student.course?.title || '—'}</td>
                  <td data-label="Status"><Badge tone={statusTone(student.status)}>{student.status}</Badge></td>
                  <td className="px-4 text-right" data-label=""><Link className="inline-flex min-h-11 items-center font-semibold text-blue" to={`/admin/students/${student.id}`}>Profile</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open ? (
        <Modal title="Add student" onClose={() => setOpen(false)}>
          <form className="space-y-3" onSubmit={create}>
            {error ? <Notice tone="error">{error}</Notice> : null}
            <Field label="Name"><input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
            <Field label="Email"><input className={inputClass} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
            <Field label="Phone"><input className={inputClass} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
            <Field label="Status"><select className={inputClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="waitlist">Waitlist</option><option value="active">Active</option><option value="completed">Completed</option><option value="withdrawn">Withdrawn</option></select></Field>
            <Field label="Course"><select className={inputClass} value={form.course_id} onChange={(event) => setForm({ ...form, course_id: event.target.value })}><option value="">No course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></Field>
            <Field label="Notes"><textarea className={inputClass} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field>
            <Button type="submit" variant="blue">Save student</Button>
          </form>
        </Modal>
      ) : null}
    </section>
  )
}

export function StudentProfilePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const manageable = can(user, 'students.manage')
  const [student, setStudent] = useState(null)
  const [courses, setCourses] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/api/v1/admin/students/${id}`)
      .then((response) => setStudent({ ...response.data.data, course_id: response.data.data.course?.id || '' }))
      .catch((loadError) => setError(errorMessage(loadError, 'The student record could not be loaded.')))
  }, [id])

  useEffect(() => {
    if (!manageable) return
    api.get('/api/v1/admin/courses?per_page=100').then((response) => setCourses(response.data.data || [])).catch(() => setCourses([]))
  }, [manageable])

  async function save(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      await ensureCsrf()
      await api.put(`/api/v1/admin/students/${id}`, {
        name: student.name,
        email: student.email,
        phone: student.phone,
        status: student.status,
        course_id: student.course_id ? Number(student.course_id) : null,
        notes: student.notes,
        enrolled_on: student.enrolled_on,
      })
      setMessage('Student record saved.')
    } catch (saveError) {
      setError(errorMessage(saveError, 'The student record was not saved.'))
    }
  }

  if (!student && !error) return <Spinner />
  if (!student) return <p className="text-red-700" role="alert">{error}</p>

  return (
    <form className="max-w-xl space-y-3" onSubmit={save}>
      <Seo title={student.name} path={`/admin/students/${id}`} robots="noindex,nofollow" />
      <h1 className="text-2xl font-semibold">{student.name}</h1>
      {message ? <Notice tone="success">{message}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Field label="Name"><input className={inputClass} value={student.name} disabled={!manageable} onChange={(event) => setStudent({ ...student, name: event.target.value })} /></Field>
      <Field label="Email"><input className={inputClass} value={student.email} disabled={!manageable} onChange={(event) => setStudent({ ...student, email: event.target.value })} /></Field>
      <Field label="Status"><select className={inputClass} value={student.status} disabled={!manageable} onChange={(event) => setStudent({ ...student, status: event.target.value })}><option value="waitlist">Waitlist</option><option value="active">Active</option><option value="completed">Completed</option><option value="withdrawn">Withdrawn</option></select></Field>
      <Field label="Course"><select className={inputClass} value={student.course_id || ''} disabled={!manageable} onChange={(event) => setStudent({ ...student, course_id: event.target.value })}><option value="">No course</option>{student.course && !courses.some((course) => course.id === student.course.id) ? <option value={student.course.id}>{student.course.title}</option> : null}{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></Field>
      <Field label="Internal notes"><textarea className={inputClass} value={student.notes || ''} disabled={!manageable} onChange={(event) => setStudent({ ...student, notes: event.target.value })} /></Field>
      {manageable ? <Button type="submit" variant="blue">Save</Button> : <p className="text-sm text-muted">Saving a student record needs the manage permission.</p>}
    </form>
  )
}
