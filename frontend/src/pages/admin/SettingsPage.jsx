import { useEffect, useState } from 'react'
import Seo from '../../components/Seo'
import { Button, Field, Notice, Spinner, inputClass } from '../../components/ui'
import { api, ensureCsrf, errorMessage } from '../../services/api'

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
    event.target.value = ''
    if (!file) return
    setError('')
    setMessage('')
    const body = new FormData()
    body.append('file', file)
    body.append('alt', 'Marqetise logo')
    try {
      await ensureCsrf()
      const response = await api.post('/api/v1/admin/media', body)
      const next = { ...settings, logo_url: response.data.data.url }
      setSettings(next)
      try {
        const saved = await api.put('/api/v1/admin/settings', { settings: next })
        applySettings(saved)
        setMessage('Logo saved.')
      } catch (saveError) {
        setError(errorMessage(saveError, 'The logo was uploaded. Save settings to keep it.'))
      }
    } catch (uploadError) {
      setError(errorMessage(uploadError, 'The logo was not uploaded.'))
    }
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
    ['ip_retention_days', 'IP retention days'],
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
        <Field
          key={key}
          label={label}
          hint={key === 'ip_retention_days' ? 'Leave blank to keep inquiry and audit IP addresses. A number is how many days after the record was created those addresses are cleared. Do not guess a period.' : undefined}
        >
          <input className={inputClass} inputMode={key === 'ip_retention_days' ? 'numeric' : undefined} value={settings[key] ?? ''} onChange={(event) => setSettings({ ...settings, [key]: event.target.value })} />
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
