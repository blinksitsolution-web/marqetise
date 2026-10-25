import { useEffect, useState } from 'react'
import Seo from '../../components/Seo'
import { Badge, Button, EmptyState, Field, Modal, Notice, Pager, Spinner, inputClass, statusTone } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { api, can, ensureCsrf, errorMessage } from '../../services/api'
import { formatDate } from '../../utils/format'

export function UsersPage() {
  const { user } = useAuth()
  const [payload, setPayload] = useState(null)
  const [roles, setRoles] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', role_id: '', status: 'active', send_invite: true })
  const [mailCanDeliver, setMailCanDeliver] = useState(null)

  function load() {
    api.get(`/api/v1/admin/users?search=${encodeURIComponent(search)}&page=${page}`).then((response) => setPayload(response.data))
  }

  useEffect(load, [search, page])
  useEffect(() => {
    if (can(user, 'roles.view')) {
      api.get('/api/v1/admin/roles').then((response) => setRoles(response.data.data.roles)).catch(() => setRoles([]))
    }
    if (can(user, 'settings.view')) {
      api.get('/api/v1/admin/settings').then((response) => setMailCanDeliver(response.data.mail_can_deliver)).catch(() => setMailCanDeliver(null))
    }
  }, [user])

  async function create(event) {
    event.preventDefault()
    setError('')
    try {
      await ensureCsrf()
      const response = await api.post('/api/v1/admin/users', { ...form, role_id: Number(form.role_id), phone: form.phone || null })
      setMessage(response.data.message)
      setOpen(false)
      load()
    } catch (saveError) {
      setError(errorMessage(saveError))
    }
  }

  async function changeStatus(account, status) {
    if (status === 'suspended' && !window.confirm(`Suspend ${account.name}? They will not be able to sign in.`)) return
    setError('')
    try {
      await ensureCsrf()
      await api.put(`/api/v1/admin/users/${account.id}`, { status })
      load()
    } catch (saveError) {
      setError(errorMessage(saveError, 'The account status was not changed.'))
    }
  }

  async function changeRole(account, roleId) {
    setError('')
    try {
      await ensureCsrf()
      await api.put(`/api/v1/admin/users/${account.id}`, { role_id: Number(roleId) })
      load()
    } catch (saveError) {
      setError(errorMessage(saveError, 'The role was not changed.'))
    }
  }

  async function removeUser(account) {
    if (!window.confirm(`Delete ${account.name}? They will lose access. This cannot be undone.`)) return
    setError('')
    try {
      await ensureCsrf()
      await api.delete(`/api/v1/admin/users/${account.id}`)
      setMessage('User deleted.')
      load()
    } catch (deleteError) {
      setError(errorMessage(deleteError, 'The user was not deleted.'))
    }
  }

  async function resendInvite(account) {
    setError('')
    try {
      await ensureCsrf()
      const response = await api.post(`/api/v1/admin/users/${account.id}/invite`)
      setMessage(response.data.message)
    } catch (saveError) {
      setError(errorMessage(saveError, 'The invitation was not sent.'))
    }
  }

  const data = payload?.data || []

  return (
    <section>
      <Seo title="Users" path="/admin/users" robots="noindex,nofollow" />
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Users</h1>
        {can(user, 'users.manage') ? <Button variant="blue" onClick={() => setOpen(true)}>Add user</Button> : null}
      </div>
      <p className="mt-1 text-sm text-muted">Passwords are never shown. New people set their own password from an invitation link.</p>
      {message ? <div className="mt-4"><Notice tone="success">{message}</Notice></div> : null}
      {error && !open ? <div className="mt-4"><Notice tone="error">{error}</Notice></div> : null}
      <input className={`${inputClass} mt-4 max-w-sm`} aria-label="Search users" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
      {!payload ? <div className="mt-6"><Spinner /></div> : data.length === 0 ? <div className="mt-6"><EmptyState title="No users match" body="Try another name or email." /></div> : (
        <div className="mt-4 overflow-x-auto rounded-2xl bg-white">
          <table className="record-table w-full text-left text-sm">
            <thead className="text-muted"><tr><th className="px-4 py-3">User</th><th>Role</th><th>Status</th><th>Last login</th><th /></tr></thead>
            <tbody>
              {data.map((account) => (
                <tr key={account.id} className="border-t border-line">
                  <td className="px-4 py-3" data-label="User"><p className="font-medium">{account.name}</p><p className="text-xs text-muted">{account.email}</p></td>
                  <td data-label="Role">
                    {can(user, 'users.manage') && can(user, 'roles.view') && account.id !== user.id ? (
                      <select className={inputClass} aria-label={`Role for ${account.name}`} value={account.role?.id || ''} onChange={(event) => changeRole(account, event.target.value)}>
                        {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                      </select>
                    ) : account.role?.name}
                  </td>
                  <td data-label="Status"><Badge tone={statusTone(account.status)}>{account.status}</Badge></td>
                  <td data-label="Last login">{formatDate(account.last_login_at)}</td>
                  <td className="px-4 text-right" data-label="Action">
                    {can(user, 'users.manage') && account.id !== user.id ? (
                      <div className="flex flex-wrap justify-end gap-3">
                        {account.status !== 'suspended' ? (
                          <button type="button" className="inline-flex min-h-11 items-center text-sm font-semibold text-blue" onClick={() => resendInvite(account)}>Send invite</button>
                        ) : null}
                        <button type="button" className="inline-flex min-h-11 items-center text-sm font-semibold text-blue" onClick={() => changeStatus(account, account.status === 'suspended' ? 'active' : 'suspended')}>
                          {account.status === 'suspended' ? 'Activate' : 'Suspend'}
                        </button>
                        <button type="button" className="inline-flex min-h-11 items-center text-sm font-semibold text-red-700" onClick={() => removeUser(account)}>Delete</button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager meta={payload?.meta} onPage={setPage} />
      {open ? (
        <Modal title="Add user" onClose={() => setOpen(false)}>
          <form className="space-y-3" onSubmit={create}>
            {error ? <Notice tone="error">{error}</Notice> : null}
            <Field label="Full name"><input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
            <Field label="Email"><input className={inputClass} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
            <Field label="Role">
              <select className={inputClass} value={form.role_id} onChange={(event) => setForm({ ...form, role_id: event.target.value })}>
                <option value="">Select a role</option>
                {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
              </select>
            </Field>
            {mailCanDeliver === false ? <Notice tone="error">Email delivery is not configured, so an invitation cannot be sent.</Notice> : null}
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.send_invite} onChange={(event) => setForm({ ...form, send_invite: event.target.checked })} /> Send invitation to set a password</label>
            <Button type="submit" variant="blue" disabled={mailCanDeliver === false || !form.send_invite}>Create user</Button>
          </form>
        </Modal>
      ) : null}
    </section>
  )
}

