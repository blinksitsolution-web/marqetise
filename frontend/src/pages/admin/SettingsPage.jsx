import { useEffect, useRef, useState } from 'react'
import Seo from '../../components/Seo'
import { MediaImageField, flushImageFields } from '../../components/MediaImageField'
import { Button, Field, Notice, Spinner, inputClass } from '../../components/ui'
import { api, ensureCsrf, errorMessage } from '../../services/api'

const groups = [
  {
    id: 'brand',
    title: 'General',
    help: 'The name and logo used across the public site. When no uploaded logo is available, the site uses the bundled Marqetise logo.',
    fields: [
      ['company_name', 'Company name', 'Used in the copyright line when it is set.', 'text'],
      ['tagline', 'Tagline', 'Shown where the public site prints the tagline.', 'text'],
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    help: 'Shown in the header menu and footer when filled in. An empty value stays hidden.',
    fields: [
      ['email', 'Public email', 'The address visitors can use to reach the team.', 'email'],
      ['phone', 'Phone', 'Shown next to the public email.', 'text'],
      ['address', 'Address', 'Shown in the footer when it is filled in.', 'textarea'],
      ['hours', 'Hours', 'Shown in the header menu when it is filled in.', 'text'],
    ],
  },
  {
    id: 'social',
    title: 'Social',
    help: 'Use a full https address. An empty value hides that icon.',
    fields: [
      ['social_linkedin', 'LinkedIn', '', 'url'],
      ['social_instagram', 'Instagram', '', 'url'],
      ['social_facebook', 'Facebook', '', 'url'],
      ['social_x', 'X', '', 'url'],
      ['social_youtube', 'YouTube', '', 'url'],
    ],
  },
  {
    id: 'seo',
    title: 'SEO',
    help: 'Used when an individual page does not set its own title or description.',
    fields: [
      ['meta_title', 'Default meta title', '', 'text'],
      ['meta_description', 'Default meta description', '', 'textarea'],
    ],
  },
  {
    id: 'email',
    title: 'Email',
    help: 'Enquiry and booking messages are sent to this address when mail delivery is configured.',
    fields: [
      ['notification_email', 'Staff notification email', 'This address is not published on the website.', 'email'],
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy',
    help: 'Controls how long inquiry and audit IP addresses are kept.',
    fields: [
      ['ip_retention_days', 'IP retention days', 'Leave blank to keep inquiry and audit IP addresses. A number is how many days after the record was created those addresses are cleared. Do not guess a period.', 'text'],
    ],
  },
]

function LogoPreview({ url }) {
  const [failed, setFailed] = useState(false)
  const missing = !url || failed

  useEffect(() => {
    setFailed(false)
  }, [url])

  return (
    <div className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl bg-navy-900 p-4">
      <img
        src={missing ? '/images/logo-white.png' : url}
        alt="Marqetise logo"
        className="max-h-16 max-w-full"
        onError={() => {
          if (!failed) setFailed(true)
        }}
      />
      {missing ? <p className="text-center text-sm text-white/80">Using the bundled Marqetise logo.</p> : null}
    </div>
  )
}

export function SettingsPage() {
  const [settings, setSettings] = useState(null)
  const settingsRef = useRef(null)
  const [saved, setSaved] = useState(null)
  const [mailCanDeliver, setMailCanDeliver] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function replaceSettings(value) {
    const next = typeof value === 'function' ? value(settingsRef.current) : value
    settingsRef.current = next
    setSettings(next)
  }

  function applySettings(response) {
    const next = response.data.data
    settingsRef.current = next
    setSettings(next)
    setSaved(structuredClone(next))
    setMailCanDeliver(response.data.mail_can_deliver)
  }

  useEffect(() => {
    api.get('/api/v1/admin/settings').then(applySettings)
  }, [])

  async function save(event) {
    event.preventDefault()
    setError('')
    try {
      await flushImageFields('settings')
      await ensureCsrf()
      const response = await api.put('/api/v1/admin/settings', { settings: settingsRef.current })
      applySettings(response)
      setMessage('Settings saved. Secrets and database credentials are not available here.')
    } catch (saveError) {
      setError(saveError?.response ? errorMessage(saveError) : (saveError.message || 'Settings were not saved.'))
    }
  }

  if (!settings) return <Spinner />

  const dirty = JSON.stringify(settings) !== JSON.stringify(saved)

  return (
    <form onSubmit={save}>
      <Seo title="Settings" path="/admin/settings" robots="noindex,nofollow" />
      <div className="sticky top-0 z-20 -mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface/95 px-4 py-3 sm:-mx-6 sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-muted" role="status">{dirty ? 'You have unsaved changes.' : 'All settings match the last save.'}</p>
        </div>
        <Button type="submit" variant="blue">Save settings</Button>
      </div>
      {message ? <Notice tone="success">{message}</Notice> : null}
      {error ? <div className="mt-3"><Notice tone="error">{error}</Notice></div> : null}
      <div className="mt-4 grid min-w-0 gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav className="min-w-0 lg:sticky lg:top-24 lg:self-start" aria-label="Settings sections">
          <ul className="flex gap-2 overflow-x-auto lg:block lg:space-y-1">
            {groups.map((group) => (
              <li key={group.id}>
                <a className="inline-flex min-h-11 items-center whitespace-nowrap rounded-xl px-3 text-sm hover:bg-white" href={`#settings-${group.id}`}>{group.title}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="grid min-w-0 items-start gap-4 xl:grid-cols-2">
          {groups.map((group) => (
            <section key={group.id} id={`settings-${group.id}`} className="scroll-mt-24 space-y-4 rounded-2xl bg-white p-4 sm:p-6" aria-labelledby={`settings-${group.id}-title`}>
              <div>
                <h2 id={`settings-${group.id}-title`} className="text-xl font-semibold">{group.title}</h2>
                <p className="mt-1 text-sm text-muted">{group.help}</p>
              </div>
              {group.id === 'email' && mailCanDeliver === false ? (
                <Notice tone="error">Email delivery is not configured. Reset and invitation emails are not being sent.</Notice>
              ) : null}
              {group.id === 'brand' ? (
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem] sm:items-start">
                  <div className="space-y-4">
                    {group.fields.map(([key, label, hint, type]) => (
                      <SettingField key={key} settingKey={key} label={label} hint={hint} type={type} value={settings[key] ?? ''} onChange={(value) => replaceSettings({ ...settingsRef.current, [key]: value })} />
                    ))}
                  </div>
                  <div className="space-y-3">
                    <LogoPreview url={settings.logo_url} />
                    <MediaImageField scope="settings" label="Logo" value={settings.logo_url || ''} onChange={(url) => replaceSettings({ ...settingsRef.current, logo_url: url })} onError={setError} />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {group.fields.map(([key, label, hint, type]) => (
                    <SettingField key={key} settingKey={key} label={label} hint={hint} type={type} value={settings[key] ?? ''} onChange={(value) => replaceSettings({ ...settingsRef.current, [key]: value })} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </form>
  )
}

function SettingField({ settingKey, label, hint, type, value, onChange }) {
  const control = type === 'textarea'
    ? <textarea className={`${inputClass} min-h-24`} value={value} onChange={(event) => onChange(event.target.value)} />
    : <input className={inputClass} type={type === 'email' || type === 'url' ? type : 'text'} inputMode={settingKey === 'ip_retention_days' ? 'numeric' : undefined} value={value} onChange={(event) => onChange(event.target.value)} />

  return <Field label={label} hint={hint || undefined}>{control}</Field>
}
