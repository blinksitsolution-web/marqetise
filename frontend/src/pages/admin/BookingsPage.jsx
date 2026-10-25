import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Seo from '../../components/Seo'
import { Badge, Button, EmptyState, Field, Modal, Notice, Pager, Skeleton, inputClass, statusTone } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { api, can, ensureCsrf, errorMessage } from '../../services/api'
import { formatDate } from '../../utils/format'

import { useRows } from './useRows'
export function BookingsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
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

  useEffect(() => {
    if (!id) return undefined
    let cancelled = false
    api.get(`/api/v1/admin/bookings/${id}`)
      .then((response) => {
        if (!cancelled) setSelected(response.data.data)
      })
      .catch(() => {
        if (!cancelled) setSaveError('That booking could not be opened.')
      })
    return () => { cancelled = true }
  }, [id])

  function closeReview() {
    setSelected(null)
    setSaveError('')
    if (id) navigate('/admin/bookings')
  }

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
      closeReview()
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
      {saveError && !selected ? <p className="mt-4 text-red-700" role="alert">{saveError}</p> : null}
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
                  <td className="px-4 text-right" data-label="Action"><button type="button" className="inline-flex min-h-11 items-center font-semibold text-blue" onClick={() => setSelected(booking)}>Review</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager meta={rows?.meta} onPage={setPage} />
      {selected ? (
        <Modal title={selected.reference} onClose={closeReview}>
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

