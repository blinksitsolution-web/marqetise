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
                  <td>
                    {can(user, 'users.manage') && can(user, 'roles.view') && account.id !== user.id ? (
                      <select className={inputClass} aria-label={`Role for ${account.name}`} value={account.role?.id || ''} onChange={(event) => changeRole(account, event.target.value)}>
                        {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                      </select>
                    ) : account.role?.name}
                  </td>
                  <td><Badge tone={statusTone(account.status)}>{account.status}</Badge></td>
                  <td>{formatDate(account.last_login_at)}</td>
                  <td className="px-4 text-right">
                    {can(user, 'users.manage') && account.id !== user.id ? (
                      <div className="flex flex-wrap justify-end gap-3">
                        {account.status !== 'suspended' ? (
                          <button type="button" className="inline-flex min-h-11 items-center text-sm font-semibold text-blue" onClick={() => resendInvite(account)}>Send invite</button>
                        ) : null}
                        <button type="button" className="inline-flex min-h-11 items-center text-sm font-semibold text-blue" onClick={() => changeStatus(account, account.status === 'suspended' ? 'active' : 'suspended')}>
                          {account.status === 'suspended' ? 'Activate' : 'Suspend'}
                        </button>
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

export function PermissionsPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function load() {
    api.get('/api/v1/admin/roles').then((response) => setData(response.data.data))
  }

  useEffect(load, [])

  async function toggle(role, permissionId) {
    if (!can(user, 'roles.manage') || role.slug === 'super-admin') return
    const current = new Set(role.permissions.map((permission) => permission.id))
    if (current.has(permissionId)) current.delete(permissionId)
    else current.add(permissionId)
    setMessage('')
    setError('')
    try {
      await ensureCsrf()
      await api.put(`/api/v1/admin/roles/${role.id}`, {
        name: role.name,
        slug: role.slug,
        description: role.description,
        permission_ids: [...current],
      })
      setMessage('Permissions saved.')
    } catch (saveError) {
      setError(errorMessage(saveError, 'Permissions were not saved.'))
    }
    load()
  }

  if (!data) return <Spinner />
  const groups = [...new Set(data.permissions.map((permission) => permission.group))]

  return (
    <section>
      <Seo title="Permissions" path="/admin/permissions" robots="noindex,nofollow" />
      <h1 className="text-2xl font-semibold">Permissions</h1>
      <p className="mt-1 text-sm text-muted">The server rejects any action the signed-in role cannot perform. Hiding a button is not the control.</p>
      {message ? <div className="mt-4"><Notice tone="success">{message}</Notice></div> : null}
      {error ? <div className="mt-4"><Notice tone="error">{error}</Notice></div> : null}
      <div className="mt-4 space-y-3 md:hidden">
        {data.permissions.map((permission) => (
          <article key={permission.id} className="rounded-2xl bg-white p-4">
            <h2 className="font-semibold">{permission.name}</h2>
            <ul className="mt-2">
              {data.roles.map((role) => {
                const checked = role.slug === 'super-admin' || role.permissions.some((item) => item.id === permission.id)
                return (
                  <li key={role.id} className="flex min-h-11 items-center justify-between gap-3 text-sm">
                    <span>{role.name}</span>
                    <input type="checkbox" aria-label={`${role.name} ${permission.name}`} checked={checked} disabled={!can(user, 'roles.manage') || role.slug === 'super-admin'} onChange={() => toggle(role, permission.id)} />
                  </li>
                )
              })}
            </ul>
          </article>
        ))}
      </div>
      <div className="mt-4 hidden overflow-x-auto rounded-2xl bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-muted">
              <th className="px-4 py-3">Permission</th>
              {data.roles.map((role) => <th key={role.id} className="px-3 py-3">{role.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {groups.flatMap((group) => [
                <tr key={`${group}-heading`}><td className="bg-surface px-4 py-2 text-xs font-semibold uppercase" colSpan={data.roles.length + 1}>{group}</td></tr>,
                ...data.permissions.filter((permission) => permission.group === group).map((permission) => (
                  <tr key={permission.id} className="border-t border-line">
                    <td className="px-4 py-2">{permission.name}</td>
                    {data.roles.map((role) => {
                      const checked = role.slug === 'super-admin' || role.permissions.some((item) => item.id === permission.id)
                      return (
                        <td key={role.id} className="px-3">
                          <input type="checkbox" aria-label={`${role.name} ${permission.name}`} checked={checked} disabled={!can(user, 'roles.manage') || role.slug === 'super-admin'} onChange={() => toggle(role, permission.id)} />
                        </td>
                      )
                    })}
                  </tr>
                )),
            ])}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function SettingsPage() {
  const [settings, setSettings] = useState(null)
  const [mailCanDeliver, setMailCanDeliver] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function applySettings(response) {
    setSettings(response.data.data)
    setMailCanDeliver(response.data.mail_can_deliver)
  }

  useEffect(() => {
    api.get('/api/v1/admin/settings').then(applySettings)
  }, [])

  async function save(event) {
    event.preventDefault()
    setError('')
    try {
      await ensureCsrf()
      const response = await api.put('/api/v1/admin/settings', { settings })
      applySettings(response)
      setMessage('Settings saved. Secrets and database credentials are not available here.')
    } catch (saveError) {
      setError(errorMessage(saveError))
    }
  }

  async function upload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const body = new FormData()
    body.append('file', file)
    body.append('alt', 'Marqetise logo')
    await ensureCsrf()
    const response = await api.post('/api/v1/admin/media', body)
    setSettings({ ...settings, logo_url: response.data.data.url })
  }

  if (!settings) return <Spinner />
  const fields = [
    ['company_name', 'Company name'],
    ['tagline', 'Tagline'],
    ['email', 'Public email'],
    ['phone', 'Phone'],
    ['address', 'Address'],
    ['hours', 'Hours'],
    ['notification_email', 'Staff notification email'],
    ['meta_title', 'Default meta title'],
    ['meta_description', 'Default meta description'],
    ['social_linkedin', 'LinkedIn'],
    ['social_instagram', 'Instagram'],
    ['social_facebook', 'Facebook'],
    ['social_x', 'X'],
    ['social_youtube', 'YouTube'],
  ]

  return (
    <form className="max-w-2xl space-y-4" onSubmit={save}>
      <Seo title="Settings" path="/admin/settings" robots="noindex,nofollow" />
      <h1 className="text-2xl font-semibold">Settings</h1>
      {message ? <Notice tone="success">{message}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      {mailCanDeliver === false ? <Notice tone="error">Email delivery is not configured. Reset and invitation emails are not being sent.</Notice> : null}
      {fields.map(([key, label]) => (
        <Field key={key} label={label}>
          <input className={inputClass} value={settings[key] || ''} onChange={(event) => setSettings({ ...settings, [key]: event.target.value })} />
        </Field>
      ))}
      <Field label="Logo" hint="JPEG, PNG, or WebP. Maximum 5 MB.">
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} />
      </Field>
      {settings.logo_url ? <img src={settings.logo_url} alt="Uploaded logo" className="h-16 rounded-xl bg-navy-900" /> : null}
      <Button type="submit" variant="blue">Save settings</Button>
    </form>
  )
}
