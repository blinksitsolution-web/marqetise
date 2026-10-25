import { useState } from 'react'
import { LegalNotice } from '../../components/LegalNotice'
import Seo from '../../components/Seo'
import { Button, Field, Notice, inputClass } from '../../components/ui'
import { useAuth } from '../../context/useAuth'
import { api, ensureCsrf, errorMessage } from '../../services/api'

export default function AccountPage() {
  const { user, refresh } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    current_password: '',
    password: '',
    password_confirmation: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function save(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    const payload = { name: form.name, phone: form.phone || null }
    if (form.password) {
      payload.current_password = form.current_password
      payload.password = form.password
      payload.password_confirmation = form.password_confirmation
    }
    try {
      await ensureCsrf()
      await api.patch('/api/v1/account', payload)
      await refresh()
      setForm((current) => ({ ...current, current_password: '', password: '', password_confirmation: '' }))
      setMessage(form.password ? 'Account saved. Other sessions were signed out.' : 'Account saved.')
    } catch (saveError) {
      setError(errorMessage(saveError, 'The account was not saved.'))
    }
  }

  return (
    <form className="mx-auto max-w-xl space-y-4" onSubmit={save}>
      <Seo title="Your account" path="/admin/account" robots="noindex,nofollow" />
      <h1 className="text-2xl font-semibold">Your account</h1>
      <p className="text-sm text-muted">Changing the password signs out other sessions. This session stays signed in.</p>
      {message ? <Notice tone="success">{message}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Field label="Name"><input className={inputClass} value={form.name} onChange={(event) => update('name', event.target.value)} /></Field>
      <Field label="Phone"><input className={inputClass} value={form.phone} onChange={(event) => update('phone', event.target.value)} /></Field>
      <Field label="Current password" hint="Required only when you set a new password.">
        <input className={inputClass} type="password" autoComplete="current-password" value={form.current_password} onChange={(event) => update('current_password', event.target.value)} />
      </Field>
      <Field label="New password">
        <input className={inputClass} type="password" autoComplete="new-password" value={form.password} onChange={(event) => update('password', event.target.value)} />
      </Field>
      <Field label="Confirm new password">
        <input className={inputClass} type="password" autoComplete="new-password" value={form.password_confirmation} onChange={(event) => update('password_confirmation', event.target.value)} />
      </Field>
      <LegalNotice>Your account stores your name and phone. Read the</LegalNotice>
      <Button type="submit" variant="blue">Save account</Button>
    </form>
  )
}
