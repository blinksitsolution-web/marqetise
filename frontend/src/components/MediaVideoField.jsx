import { useEffect, useId, useRef, useState } from 'react'
import { registerFlushField } from './MediaImageField.jsx'
import { api, ensureCsrf, errorMessage } from '../services/api'
import { isUploadedVideo, youtubeEmbed } from './youtubeUrl.js'

const VIDEO_LIMIT = 25 * 1024 * 1024

function videoRejection(file) {
  const type = (file.type || '').toLowerCase()
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const knownType = ['video/mp4', 'application/mp4', 'video/webm', 'video/quicktime'].includes(type)
  const knownExtension = ['mp4', 'webm', 'mov'].includes(extension)
  if (type && !knownType) return 'Use an MP4, WebM, or MOV video.'
  if (!knownExtension) return 'Use an MP4, WebM, or MOV video.'
  if (file.size > VIDEO_LIMIT) return 'The video must be 25 MB or smaller.'
  return ''
}

export function MediaVideoField({ scope, label, value, removed = false, onChange, onError }) {
  const inputId = useId()
  const fileRef = useRef(null)
  const urlRef = useRef(null)
  const inflight = useRef(null)
  const [mode, setMode] = useState(() => (isUploadedVideo(value) ? 'file' : 'youtube'))
  const [draft, setDraft] = useState(() => (isUploadedVideo(value) ? '' : value || ''))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const draftRef = useRef(draft)
  const modeRef = useRef(mode)
  const onChangeRef = useRef(onChange)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onChangeRef.current = onChange
    onErrorRef.current = onError
    modeRef.current = mode
    draftRef.current = draft
  })

  useEffect(() => {
    if (isUploadedVideo(value)) {
      setMode('file')
      setDraft('')
    } else if (value) {
      setMode('youtube')
      setDraft(value)
    }
  }, [value])

  function fail(message) {
    setError(message)
    onErrorRef.current?.(message)
    return { ok: false, message }
  }

  function commitYouTube(raw) {
    const embed = youtubeEmbed(raw)
    if (!embed) return false
    onChangeRef.current?.({ video_url: embed, video_kind: 'youtube', video_removed: false })
    return true
  }

  function start(file) {
    if (inflight.current) return inflight.current
    const rejection = videoRejection(file)
    if (rejection) return Promise.resolve(fail(rejection))
    const task = (async () => {
      setBusy(true)
      setError('')
      const body = new FormData()
      body.append('file', file)
      body.append('alt', label || '')
      try {
        await ensureCsrf()
        const response = await api.post('/api/v1/admin/media', body)
        const url = response.data?.data?.url || ''
        if (!isUploadedVideo(url)) return fail('The video was not uploaded.')
        onChangeRef.current?.({ video_url: url, video_kind: 'file', video_removed: false })
        setMode('file')
        if (fileRef.current) fileRef.current.value = ''
        return { ok: true, url }
      } catch (uploadError) {
        return fail(errorMessage(uploadError, 'The video was not uploaded.'))
      } finally {
        setBusy(false)
        inflight.current = null
      }
    })()
    inflight.current = task
    return task
  }

  const runRef = useRef(async () => ({ ok: true }))
  runRef.current = async () => {
    if (inflight.current) return inflight.current
    if (modeRef.current === 'youtube') {
      const raw = (urlRef.current?.value ?? draftRef.current).trim()
      if (raw === '') return { ok: true }
      if (!commitYouTube(raw)) return fail('Use a YouTube link, such as youtube.com/watch?v=…, youtu.be/…, or a Shorts link.')
    }
    const file = fileRef.current?.files?.[0]
    if (file) return start(file)
    return { ok: true }
  }

  useEffect(() => registerFlushField({ scope, run: () => runRef.current() }), [scope])

  const preview = isUploadedVideo(value) ? 'file' : youtubeEmbed(value) ? 'youtube' : ''

  return (
    <div className="grid gap-3">
      <p className="text-sm font-medium text-ink">{label}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={`${label} source`}>
        <button
          type="button"
          aria-pressed={mode === 'youtube'}
          className={`min-h-11 rounded-lg px-4 text-sm font-semibold ${mode === 'youtube' ? 'bg-blue text-white' : 'border border-line bg-white text-ink'}`}
          onClick={() => {
            setMode('youtube')
            setError('')
          }}
        >
          YouTube link
        </button>
        <button
          type="button"
          aria-pressed={mode === 'file'}
          className={`min-h-11 rounded-lg px-4 text-sm font-semibold ${mode === 'file' ? 'bg-blue text-white' : 'border border-line bg-white text-ink'}`}
          onClick={() => {
            setMode('file')
            setError('')
          }}
        >
          Upload file
        </button>
      </div>

      {mode === 'youtube' ? (
        <div key="youtube" className="grid gap-2 text-sm font-semibold text-ink">
          <label htmlFor={inputId}>YouTube URL</label>
          <input
            ref={urlRef}
            id={inputId}
            type="url"
            value={draft}
            placeholder="https://www.youtube.com/watch?v="
            className="min-h-11 rounded-lg border border-line px-3 font-normal"
            onChange={(event) => {
              const next = event.target.value
              setDraft(next)
              draftRef.current = next
              setError('')
              if (youtubeEmbed(next)) commitYouTube(next)
              else if (next.trim() === '') onChangeRef.current?.({ video_url: '', video_kind: '', video_removed: false })
            }}
          />
          <p className="font-normal text-muted">youtube.com/watch, youtu.be, Shorts, or an embed link.</p>
        </div>
      ) : (
        <div key="file" className="grid gap-2 text-sm font-semibold text-ink">
          <label htmlFor={inputId}>Video file</label>
          <input
            ref={fileRef}
            id={inputId}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            disabled={busy}
            className="min-h-11 font-normal file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-blue file:px-4 file:font-semibold file:text-white"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) start(file)
            }}
          />
          <p className="font-normal text-muted">MP4, WebM, or MOV. Maximum 25 MB.</p>
        </div>
      )}

      {preview === 'youtube' ? (
        <iframe title="Intro video preview" src={value} className="aspect-video w-full max-w-md rounded-lg border border-line" />
      ) : null}
      {preview === 'file' ? (
        <video src={value} controls className="aspect-video w-full max-w-md rounded-lg border border-line bg-black" />
      ) : null}
      {removed && !value ? <p className="text-sm text-muted">The play button is hidden. Save to keep it off the page.</p> : null}
      {!value && !removed ? <p className="text-sm text-muted">The template video stays until you choose one.</p> : null}
      {value ? (
        <button
          type="button"
          className="min-h-11 w-fit rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink"
          onClick={() => {
            setDraft('')
            draftRef.current = ''
            setError('')
            onChange?.({ video_url: '', video_kind: '', video_removed: true })
          }}
        >
          Remove video
        </button>
      ) : null}
      {busy ? <p className="text-sm text-muted" role="status">Uploading the video…</p> : null}
      {error ? <p role="alert" className="text-sm font-semibold text-brand">{error}</p> : null}
    </div>
  )
}
