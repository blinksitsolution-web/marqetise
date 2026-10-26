import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { GHANA_PHONE_ERROR, GHANA_PHONE_HINT, GHANA_PHONE_PLACEHOLDER, ghanaE164 } from '../../components/ghanaPhone'
import { LegalNotice } from '../../components/LegalNotice'
import Seo from '../../components/Seo'
import { Badge, Button, EmptyState, Field, Modal, Notice, Pager, Skeleton, Spinner, inputClass } from '../../components/ui'
import { statusTone } from '../../components/statusTone'
import { useAuth } from '../../context/useAuth'
import { api, can, ensureCsrf, errorMessage } from '../../services/api'

import { useRows } from './useRows'
export function StudentsPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [courses, setCourses] = useState([])
  const [form, setForm] = useState({ name: '', email: '', phone: '', status: 'waitlist', course_id: '', notes: '' })
  const [page, setPage] = useState(1)
  const { rows, error: loadError, reload } = useRows(`/api/v1/admin/students?search=${encodeURIComponent(search)}&page=${page}`)

  useEffect(() => {
    if (!can(user, 'students.manage')) return
    api.get('/api/v1/admin/courses?per_page=100').then((response) => setCourses(response.data.data || [])).catch(() => setCourses([]))
  }, [user])
  const data = rows?.data || []

  async function create(event) {
    event.preventDefault()
    setError('')
    const phone = form.phone.trim()
    if (phone && !ghanaE164(phone)) {
      setError(GHANA_PHONE_ERROR)
      return
    }
    try {
      await ensureCsrf()
      await api.post('/api/v1/admin/students', { ...form, phone: phone || null, notes: form.notes || null, course_id: form.course_id ? Number(form.course_id) : null })
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
      <input className={`${inputClass} mt-4 max-w-sm`} aria-label="Search students" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
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
                  <td className="px-4 text-right" data-label="Action"><Link className="inline-flex min-h-11 items-center font-semibold text-blue" to={`/admin/students/${student.id}`}>Profile</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager meta={rows?.meta} onPage={setPage} />
      {open ? (
        <Modal title="Add student" onClose={() => setOpen(false)}>
          <form className="space-y-3" onSubmit={create}>
            {error ? <Notice tone="error">{error}</Notice> : null}
            <Field label="Name"><input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
            <Field label="Email"><input className={inputClass} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
            <Field label="Phone" hint={GHANA_PHONE_HINT}><input className={inputClass} type="tel" inputMode="tel" autoComplete="tel" placeholder={GHANA_PHONE_PLACEHOLDER} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
            <Field label="Status"><select className={inputClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="waitlist">Waitlist</option><option value="active">Active</option><option value="completed">Completed</option><option value="withdrawn">Withdrawn</option></select></Field>
            <Field label="Course"><select className={inputClass} value={form.course_id} onChange={(event) => setForm({ ...form, course_id: event.target.value })}><option value="">No course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></Field>
            <Field label="Notes"><textarea className={inputClass} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field>
            <LegalNotice>A student record stores the name, email, and phone. Read the</LegalNotice>
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
      {student.other_courses?.length ? (
        <div>
          <p className="text-sm font-medium">Other courses</p>
          <ul className="mt-1 list-disc pl-5 text-sm">
            {student.other_courses.map((course) => <li key={course.id}>{course.title}</li>)}
          </ul>
        </div>
      ) : null}
      <LegalNotice>This record stores student details. Read the</LegalNotice>
      {manageable ? <Button type="submit" variant="blue">Save</Button> : <p className="text-sm text-muted">Saving a student record needs the manage permission.</p>}
    </form>
  )
}
