import { useState } from 'react'
import { Field, inputClass } from './ui'
import { api, ensureCsrf, errorMessage } from '../services/api'

export function MediaImageField({ label, value, onChange, onError }) {
  const [busy, setBusy] = useState(false)

  async function upload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    const body = new FormData()
    body.append('file', file)
    body.append('alt', label)
    try {
      await ensureCsrf()
      const response = await api.post('/api/v1/admin/media', body)
      onChange(response.data.data.url || '')
    } catch (uploadError) {
      onError?.(errorMessage(uploadError, 'The image was not uploaded.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <Field label={label} hint="JPEG, PNG, or WebP. Maximum 5 MB.">
        <input className={inputClass} type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} disabled={busy} />
      </Field>
      {value ? <img src={value} alt="" className="mt-2 max-h-28 rounded-xl border border-line bg-white object-contain" /> : <p className="mt-1 text-xs text-muted">No image yet.</p>}
      {value ? <button type="button" className="mt-2 inline-flex min-h-11 items-center text-sm text-red-700" onClick={() => onChange('')}>Remove image</button> : null}
    </div>
  )
}
