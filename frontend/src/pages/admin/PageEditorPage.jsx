import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Seo from '../../components/Seo'
import { Button, Field, Notice, Spinner, inputClass } from '../../components/ui'
import { api, ensureCsrf, errorMessage } from '../../services/api'

export function PageEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', slug: '', excerpt: '', body: '', meta_title: '', meta_description: '', status: 'draft' })
  const formRef = useRef(form)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(id === undefined)

  useEffect(() => {
    if (!id) return
    let active = true
    api.get(`/api/v1/admin/pages/${id}`).then((response) => {
      if (!active) return
      formRef.current = response.data.data
      setForm(response.data.data)
      setLoaded(true)
    }).catch(() => {
      if (active) setError('The page could not be loaded.')
    })
    return () => {
      active = false
    }
  }, [id])

  function setField(key, value) {
    const next = { ...formRef.current, [key]: value }
    if (key === 'title' && !id) {
      next.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }
    formRef.current = next
    setForm(next)
  }

  async function save(event) {
    event.preventDefault()
    const current = formRef.current
    setError('')
    try {
      await ensureCsrf()
      const payload = { title: current.title, slug: current.slug, excerpt: current.excerpt, body: current.body, meta_title: current.meta_title, meta_description: current.meta_description, status: current.status }
      if (id) await api.put(`/api/v1/admin/pages/${id}`, payload)
      else await api.post('/api/v1/admin/pages', payload)
      navigate('/admin/cms')
    } catch (saveError) {
      setError(errorMessage(saveError))
    }
  }

  if (!loaded) return <Spinner />

  return (
    <form className="mx-auto max-w-3xl space-y-4" onSubmit={save}>
      <Seo title={id ? 'Edit page' : 'New page'} path="/admin/cms" robots="noindex,nofollow" />
      <h1 className="text-2xl font-semibold">{id ? 'Edit page' : 'New page'}</h1>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Field label="Title"><input className={inputClass} value={form.title || ''} onChange={(event) => setField('title', event.target.value)} /></Field>
      <Field label="Slug"><input className={inputClass} value={form.slug || ''} onChange={(event) => setField('slug', event.target.value)} /></Field>
      <Field label="Excerpt"><textarea className={inputClass} value={form.excerpt || ''} onChange={(event) => setField('excerpt', event.target.value)} /></Field>
      <Field label="Body"><textarea className={`${inputClass} min-h-48`} value={form.body || ''} onChange={(event) => setField('body', event.target.value)} /></Field>
      <Field label="Meta title"><input className={inputClass} value={form.meta_title || ''} onChange={(event) => setField('meta_title', event.target.value)} /></Field>
      <Field label="Meta description"><textarea className={inputClass} value={form.meta_description || ''} onChange={(event) => setField('meta_description', event.target.value)} /></Field>
      <Field label="Status">
        <select className={inputClass} value={form.status} onChange={(event) => setField('status', event.target.value)}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </Field>
      <div className="rounded-2xl bg-surface p-4 text-sm">
        <p className="font-semibold">Preview</p>
        <h2 className="mt-2 text-xl">{form.title || 'Untitled'}</h2>
        <p className="mt-2 whitespace-pre-line text-muted">{form.body}</p>
      </div>
      <Button type="submit" variant="blue">Save page</Button>
    </form>
  )
}
