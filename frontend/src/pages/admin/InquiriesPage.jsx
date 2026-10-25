import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Seo from '../../components/Seo'
import { Badge, Button, EmptyState, Notice, Pager, Skeleton, Spinner, inputClass } from '../../components/ui'
import { statusTone } from '../../components/statusTone'
import { useAuth } from '../../context/useAuth'
import { api, can, ensureCsrf, errorMessage } from '../../services/api'
import { formatDate } from '../../utils/format'

import { useRows } from './useRows'
export function InquiriesPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const { rows, error } = useRows(`/api/v1/admin/inquiries?search=${encodeURIComponent(search)}&status=${status}&page=${page}`)
  const data = rows?.data || []

  return (
    <section>
      <Seo title="Inquiries" path="/admin/inquiries" robots="noindex,nofollow" />
      <h1 className="text-2xl font-semibold">Inquiries</h1>
      <div className="mt-4 flex gap-2">
        <input className={inputClass} aria-label="Search inquiries" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search name, email, or subject" />
        <select className={inputClass} aria-label="Inquiry status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}>
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
                  <td className="px-4 text-right" data-label="Action"><Link className="inline-flex min-h-11 items-center font-semibold text-blue" to={`/admin/inquiries/${inquiry.id}`}>Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager meta={rows?.meta} onPage={setPage} />
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

