import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Seo from '../../components/Seo'
import { Badge, Button, EmptyState, Field, Modal, Notice, Spinner, inputClass, statusTone } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { api, can, ensureCsrf, errorMessage } from '../../services/api'

export function CmsListPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('pages')
  const [rows, setRows] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [message, setMessage] = useState('')
  const manageable = can(user, 'content.manage')

  useEffect(() => {
    const path = tab === 'pages'
      ? `/api/v1/admin/pages?search=${encodeURIComponent(search)}&status=${status}`
      : tab === 'blocks' ? '/api/v1/admin/blocks' : tab === 'faqs' ? '/api/v1/admin/faqs' : '/api/v1/admin/services'
    api.get(path).then((response) => setRows(response.data.data)).catch(() => setRows([]))
  }, [tab, search, status, message])

  async function remove(path) {
    if (!window.confirm('Delete this item? This cannot be undone.')) return
    await ensureCsrf()
    await api.delete(path)
    setMessage('Deleted.')
  }

  return (
    <>
      <Seo title="Content" path="/admin/cms" robots="noindex,nofollow" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Content management</h1>
          <p className="text-sm text-muted">Only published pages, services, and visible sections appear on the website.</p>
        </div>
        {manageable && tab === 'pages' ? <Link to="/admin/cms/pages/new" className="rounded-full bg-blue px-4 py-2 text-sm font-semibold text-white">Create page</Link> : null}
      </div>
      <div className="mt-4 flex gap-2 overflow-auto">
        {['pages', 'blocks', 'faqs', 'services'].map((item) => (
          <button key={item} type="button" className={`rounded-full px-4 py-2 text-sm capitalize ${tab === item ? 'bg-ink text-white' : 'bg-white'}`} onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>
      {message ? <div className="mt-4"><Notice tone="success">{message}</Notice></div> : null}
      {tab === 'pages' ? (
        <div className="mt-4 flex gap-2">
          <input className={inputClass} placeholder="Search pages" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search pages" />
          <select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Status">
            <option value="">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      ) : null}
      {!rows ? <div className="mt-6"><Spinner /></div> : rows.length === 0 ? <div className="mt-6"><EmptyState title="Nothing here yet" body="Create a page or section when you are ready to publish it." /></div> : (
        <div className="mt-4 overflow-x-auto rounded-2xl bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-muted"><tr><th className="px-4 py-3">Title</th><th>Status</th><th /></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="px-4 py-3"><p className="font-medium">{row.title || row.label || row.name || row.question}</p><p className="text-xs text-muted">{row.slug || row.key || row.context}</p></td>
                  <td><Badge tone={statusTone(row.status || (row.is_visible || row.is_published ? 'published' : 'draft'))}>{row.status || (row.is_visible || row.is_published ? 'visible' : 'hidden')}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    {tab === 'pages' && manageable ? <Link to={`/admin/cms/pages/${row.id}`} className="font-semibold text-blue">Edit</Link> : null}
                    {manageable && tab !== 'pages' ? <button type="button" className="text-red-700" onClick={() => remove(`/api/v1/admin/${tab === 'blocks' ? 'blocks' : tab === 'faqs' ? 'faqs' : 'services'}/${row.id}`)}>Delete</button> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {manageable && tab !== 'pages' ? <BlockEditor tab={tab} onSaved={() => setMessage('Saved.')} /> : null}
    </>
  )
}

function BlockEditor({ tab, onSaved }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', body: '', question: '', answer: '', context: 'contact', name: '', slug: '', summary: '', icon: 'spark', status: 'draft', key: '', label: '', group: 'home', is_visible: false, payload: '{"title":"","items":[]}' })

  async function save(event) {
    event.preventDefault()
    setError('')
    try {
      await ensureCsrf()
      if (tab === 'faqs') {
        await api.post('/api/v1/admin/faqs', { context: form.context, question: form.question, answer: form.answer, is_published: true, sort_order: 0 })
      } else if (tab === 'services') {
        await api.post('/api/v1/admin/services', { name: form.name, slug: form.slug, summary: form.summary, icon: form.icon, status: form.status, sort_order: 0 })
      } else {
        await api.post('/api/v1/admin/blocks', { key: form.key, group: form.group, label: form.label, is_visible: form.is_visible, sort_order: 0, payload: JSON.parse(form.payload) })
      }
      setOpen(false)
      onSaved()
    } catch (saveError) {
      setError(errorMessage(saveError, 'The content was not saved.'))
    }
  }

  return (
    <div className="mt-4">
      <Button type="button" variant="blue" onClick={() => setOpen(true)}>Add {tab.slice(0, -1)}</Button>
      {open ? (
        <Modal title={`Add ${tab}`} onClose={() => setOpen(false)}>
          <form className="space-y-3" onSubmit={save}>
            {error ? <Notice tone="error">{error}</Notice> : null}
            {tab === 'faqs' ? (
              <>
                <Field label="Question"><input className={inputClass} value={form.question} onChange={(event) => setForm({ ...form, question: event.target.value })} /></Field>
                <Field label="Answer"><textarea className={inputClass} value={form.answer} onChange={(event) => setForm({ ...form, answer: event.target.value })} /></Field>
              </>
            ) : null}
            {tab === 'services' ? (
              <>
                <Field label="Name"><input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
                <Field label="Slug"><input className={inputClass} value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></Field>
                <Field label="Summary"><textarea className={inputClass} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} /></Field>
              </>
            ) : null}
            {tab === 'blocks' ? (
              <>
                <Field label="Key"><input className={inputClass} value={form.key} onChange={(event) => setForm({ ...form, key: event.target.value })} /></Field>
                <Field label="Label"><input className={inputClass} value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} /></Field>
                <Field label="JSON payload"><textarea className={`${inputClass} min-h-32`} value={form.payload} onChange={(event) => setForm({ ...form, payload: event.target.value })} /></Field>
                <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.is_visible} onChange={(event) => setForm({ ...form, is_visible: event.target.checked })} /> Visible on the website</label>
              </>
            ) : null}
            <Button type="submit" variant="blue">Save</Button>
          </form>
        </Modal>
      ) : null}
    </div>
  )
}

export function PageEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', slug: '', excerpt: '', body: '', meta_title: '', meta_description: '', status: 'draft' })
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(id === undefined)

  useEffect(() => {
    if (!id) return
    api.get(`/api/v1/admin/pages/${id}`).then((response) => {
      setForm(response.data.data)
      setLoaded(true)
    }).catch(() => setError('The page could not be loaded.'))
  }, [id])

  function setField(key, value) {
    const next = { ...form, [key]: value }
    if (key === 'title' && !id) {
      next.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }
    setForm(next)
  }

  async function save(event) {
    event.preventDefault()
    setError('')
    try {
      await ensureCsrf()
      const payload = { title: form.title, slug: form.slug, excerpt: form.excerpt, body: form.body, meta_title: form.meta_title, meta_description: form.meta_description, status: form.status }
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
