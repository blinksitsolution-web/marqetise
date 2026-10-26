import { useState } from 'react'
import { LegalNotice } from '../../components/LegalNotice'
import Seo from '../../components/Seo'
import { GHANA_PHONE_ERROR, GHANA_PHONE_HINT, GHANA_PHONE_PLACEHOLDER, ghanaE164 } from '../../components/ghanaPhone'
import { saveErrorAlert, savedAlert } from '../../components/saveAlert'
import { Button, Field, inputClass } from '../../components/ui'
import { useAuth } from '../../context/useAuth'
import { api, ensureCsrf, errorMessage } from '../../services/api'

function fieldErrorsFrom(error) {
  const errors = error?.response?.data?.errors
  if (!errors || typeof errors !== 'object') return {}
  return Object.fromEntries(
    Object.entries(errors).map(([key, messages]) => [key, Array.isArray(messages) ? messages[0] : String(messages)]),
  )
}

export default function AccountPage() {
  const { user, refresh } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    current_password: '',
    password: '',
    password_confirmation: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => ({ ...current, [key]: '' }))
  }

  async function save(event) {
    event.preventDefault()
    setFieldErrors({})

    const phone = form.phone.trim()
    if (phone && !ghanaE164(phone)) {
      setFieldErrors({ phone: GHANA_PHONE_ERROR })
      saveErrorAlert([GHANA_PHONE_ERROR])
      return
    }

    const changingPassword = Boolean(form.current_password || form.password || form.password_confirmation)

    try {
      await ensureCsrf()
      const profile = await api.patch('/api/v1/account', { name: form.name, phone: phone || null })
      const saved = profile.data?.data || {}
      setForm((current) => ({
        ...current,
        name: saved.name || current.name,
        phone: saved.phone || '',
      }))

      if (!changingPassword) {
        await refresh()
        savedAlert()
        return
      }

      try {
        await api.patch('/api/v1/account', {
          current_password: form.current_password,
          password: form.password,
          password_confirmation: form.password_confirmation,
        })
        setForm((current) => ({
          ...current,
          current_password: '',
          password: '',
          password_confirmation: '',
        }))
        await refresh()
        savedAlert()
      } catch (passwordError) {
        await refresh()
        setFieldErrors(fieldErrorsFrom(passwordError))
        saveErrorAlert([
          'The name and phone were saved.',
          errorMessage(passwordError, 'The password was not changed.'),
        ])
      }
    } catch (saveError) {
      setFieldErrors(fieldErrorsFrom(saveError))
      saveErrorAlert([errorMessage(saveError, 'The account was not saved.')])
    }
  }

  return (
    <form className="mx-auto max-w-xl space-y-4" onSubmit={save}>
      <Seo title="Your account" path="/admin/account" robots="noindex,nofollow" />
      <h1 className="text-2xl font-semibold">Your account</h1>
      <p className="text-sm text-muted">Changing the password signs out other sessions. This session stays signed in.</p>
      <Field label="Name" error={fieldErrors.name}>
        <input className={inputClass} value={form.name} onChange={(event) => update('name', event.target.value)} />
      </Field>
      <Field label="Phone" hint={GHANA_PHONE_HINT} error={fieldErrors.phone}>
        <input
          className={inputClass}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={GHANA_PHONE_PLACEHOLDER}
          value={form.phone}
          onChange={(event) => update('phone', event.target.value)}
        />
      </Field>
      <Field label="Current password" hint="Required only when you set a new password." error={fieldErrors.current_password}>
        <input className={inputClass} type="password" autoComplete="current-password" value={form.current_password} onChange={(event) => update('current_password', event.target.value)} />
      </Field>
      <Field label="New password" error={fieldErrors.password}>
        <input className={inputClass} type="password" autoComplete="new-password" value={form.password} onChange={(event) => update('password', event.target.value)} />
      </Field>
      <Field label="Confirm new password" error={fieldErrors.password_confirmation}>
        <input className={inputClass} type="password" autoComplete="new-password" value={form.password_confirmation} onChange={(event) => update('password_confirmation', event.target.value)} />
      </Field>
      <LegalNotice>Your account stores your name and phone. Read the</LegalNotice>
      <Button type="submit" variant="blue">Save account</Button>
    </form>
  )
}
