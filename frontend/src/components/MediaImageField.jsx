import { useEffect, useRef, useState } from 'react'
import { Field, inputClass } from './ui'
import { api, ensureCsrf, errorMessage } from '../services/api'

const registry = new Set()
const MAX_BYTES = 5 * 1024 * 1024

export function registerFlushField(entry) {
  registry.add(entry)
  return () => registry.delete(entry)
}

export async function flushImageFields(scope) {
  const jobs = []
  for (const entry of registry) {
    if (!scope || entry.scope === scope) jobs.push(entry.run())
  }
  const results = await Promise.all(jobs)
  const failed = results.find((result) => result?.ok === false)
  if (failed) {
    throw new Error(failed.message || 'The image was not uploaded.')
  }
}

function rejection(file) {
  const type = (file.type || '').toLowerCase()
  const name = (file.name || '').toLowerCase()
  const typeOk = type === 'image/jpeg' || type === 'image/png' || type === 'image/webp'
  const extOk = name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp')
  if (!typeOk && !extOk) return 'Use a JPEG, PNG, or WebP image.'
  if (file.size > MAX_BYTES) return 'The image must be 5 MB or smaller.'
  return ''
}

function previewSrc(value) {
  if (typeof value !== 'string') return ''
  const path = value.trim()
  if (!path || /^(blob:|data:|javascript:)/i.test(path)) return ''
  if (path.startsWith('images/')) return `/${path}`
  return path
}

export function MediaImageField({ label, value, onChange, onError, scope = 'default' }) {
  const inputRef = useRef(null)
  const inflight = useRef(null)
  const onChangeRef = useRef(onChange)
  const onErrorRef = useRef(onError)
  const labelRef = useRef(label)
  const runRef = useRef(async () => ({ ok: true, url: '' }))
  onChangeRef.current = onChange
  onErrorRef.current = onError
  labelRef.current = label
  const [busy, setBusy] = useState(false)
  const [fieldError, setFieldError] = useState('')

  function fail(message) {
    setFieldError(message)
    onErrorRef.current?.(message)
    return { ok: false, message: 'The image was not uploaded.' }
  }

  function start(file) {
    if (inflight.current) return inflight.current
    const problem = rejection(file)
    if (problem) return Promise.resolve(fail(problem))
    const task = (async () => {
      setBusy(true)
      setFieldError('')
      const body = new FormData()
      body.append('file', file)
      body.append('alt', labelRef.current || '')
      try {
        await ensureCsrf()
        const response = await api.post('/api/v1/admin/media', body)
        const url = response.data?.data?.url || ''
        if (!String(url).includes('/media/')) return fail('The image was not uploaded.')
        onChangeRef.current(url)
        if (inputRef.current) inputRef.current.value = ''
        return { ok: true, url }
      } catch (uploadError) {
        return fail(errorMessage(uploadError, 'The image was not uploaded.'))
      } finally {
        setBusy(false)
        inflight.current = null
      }
    })()
    inflight.current = task
    return task
  }

  runRef.current = () => {
    if (inflight.current) return inflight.current
    const file = inputRef.current?.files?.[0]
    if (!file) return Promise.resolve({ ok: true, url: value || '' })
    return start(file)
  }

  useEffect(() => {
    const entry = { scope, run: () => runRef.current() }
    registry.add(entry)
    return () => {
      registry.delete(entry)
    }
  }, [scope])

  function onPick(event) {
    const file = event.target.files?.[0]
    if (!file) return
    start(file)
  }

  const preview = previewSrc(value)

  return (
    <div>
      <Field label={label} hint="JPEG, PNG, or WebP. Maximum 5 MB." error={fieldError}>
        <input ref={inputRef} className={inputClass} type="file" accept="image/png,image/jpeg,image/webp,.jpg,.jpeg,.png,.webp" onChange={onPick} disabled={busy} />
      </Field>
      {busy ? <p className="mt-1 text-xs text-muted" role="status">Uploading…</p> : null}
      {preview ? <img src={preview} alt="" className="mt-2 max-h-28 rounded-xl border border-line bg-white object-contain" /> : <p className="mt-1 text-xs text-muted">No image yet.</p>}
      {preview ? <button type="button" className="mt-2 inline-flex min-h-11 items-center text-sm text-red-700" onClick={() => onChange('')}>Remove image</button> : null}
    </div>
  )
}
