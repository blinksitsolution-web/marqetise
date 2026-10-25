import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Seo from '../../components/Seo'
import { MediaImageField } from '../../components/MediaImageField'
import { Button, Field, Notice, Spinner, inputClass } from '../../components/ui'
import { api, ensureCsrf, errorMessage } from '../../services/api'
import { emptyItem, sectionPayload } from './homeSections'

function move(items, index, direction) {
  const target = index + direction
  if (target < 0 || target >= items.length) return items
  const next = items.slice()
  const [row] = next.splice(index, 1)
  next.splice(target, 0, row)
  return next
}

function FieldControl({ field, value, onChange, onError }) {
  const [key, label, type = 'text'] = field
  if (type === 'image') {
    return <MediaImageField label={label} value={value || ''} onChange={onChange} onError={onError} />
  }
  const hint = key === 'href' || key.endsWith('_href')
    ? 'Same-site path, such as /contact.'
    : key === 'slug'
      ? 'Short address used in the page link, such as office-refresh.'
      : undefined
  return (
    <Field label={label} hint={hint}>
      {type === 'textarea'
        ? <textarea className={inputClass} value={value || ''} onChange={(event) => onChange(event.target.value)} />
        : <input className={inputClass} value={value || ''} onChange={(event) => onChange(event.target.value)} />}
    </Field>
  )
}

function ItemList({ label, fields, rows, onChange, onError }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{label}</p>
      {rows.map((item, index) => (
        <div key={`${label}-${index}`} className="space-y-2 rounded-2xl border border-line p-3">
          {fields.map((field) => (
            <FieldControl
              key={field[0]}
              field={field}
              value={item[field[0]] || ''}
              onError={onError}
              onChange={(value) => onChange(rows.map((row, rowIndex) => rowIndex === index ? { ...row, [field[0]]: value } : row))}
            />
          ))}
          <div className="flex flex-wrap gap-3">
            <button type="button" className="inline-flex min-h-11 items-center text-sm font-semibold" onClick={() => onChange(move(rows, index, -1))} disabled={index === 0}>Move up</button>
            <button type="button" className="inline-flex min-h-11 items-center text-sm font-semibold" onClick={() => onChange(move(rows, index, 1))} disabled={index === rows.length - 1}>Move down</button>
            <button type="button" className="inline-flex min-h-11 items-center text-sm text-red-700" onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))}>Remove</button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => onChange([...rows, emptyItem(fields)])}>Add item</Button>
    </div>
  )
}

export function SectionEditorPage({
  title,
  seoPath,
  liveHref,
  sections,
  pageSlug = null,
  pageHelp = '',
  navLabel,
  defaultGroup = 'home',
}) {
  const [blocks, setBlocks] = useState(null)
  const [saved, setSaved] = useState(null)
  const [page, setPage] = useState(null)
  const [savedPage, setSavedPage] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState('')

  useEffect(() => {
    let active = true
    const requests = [api.get('/api/v1/admin/blocks')]
    if (pageSlug) requests.push(api.get(`/api/v1/admin/pages?search=${encodeURIComponent(pageSlug)}&page=1`))
    Promise.all(requests).then(([blockResponse, pageResponse]) => {
      if (!active) return
      const byKey = {}
      for (const block of blockResponse.data.data || []) byKey[block.key] = block
      const next = {}
      for (const section of sections) {
        const block = byKey[section.key]
        next[section.key] = {
          id: block?.id || null,
          label: block?.label || section.label,
          is_visible: block ? Boolean(block.is_visible) : false,
          sort_order: block?.sort_order ?? 0,
          payload: sectionPayload(section, block?.payload),
        }
      }
      const record = pageResponse
        ? (pageResponse.data.data || []).find((item) => item.slug === pageSlug) || null
        : null
      setBlocks(next)
      setSaved(structuredClone(next))
      setPage(record)
      setSavedPage(record ? structuredClone(record) : null)
    }).catch(() => {
      if (active) setError(`${title} could not be loaded.`)
    })
    return () => {
      active = false
    }
  }, [pageSlug, sections, title])

  function updateBlock(key, patch) {
    setBlocks((current) => ({ ...current, [key]: { ...current[key], ...patch } }))
  }

  function updatePayload(key, patch) {
    setBlocks((current) => ({
      ...current,
      [key]: { ...current[key], payload: { ...current[key].payload, ...patch } },
    }))
  }

  async function saveSection(section) {
    const block = blocks[section.key]
    setSaving(section.key)
    setError('')
    setMessage('')
    const body = {
      key: section.key,
      group: section.group || defaultGroup,
      label: block.label || section.label,
      payload: block.payload,
      is_visible: Boolean(block.is_visible),
      sort_order: block.sort_order || 0,
    }
    try {
      await ensureCsrf()
      const response = block.id
        ? await api.put(`/api/v1/admin/blocks/${block.id}`, body)
        : await api.post('/api/v1/admin/blocks', body)
      const stored = response.data.data
      const next = {
        ...block,
        id: stored.id,
        is_visible: Boolean(stored.is_visible),
        payload: sectionPayload(section, stored.payload),
      }
      setBlocks((current) => ({ ...current, [section.key]: next }))
      setSaved((current) => ({ ...current, [section.key]: structuredClone(next) }))
      setMessage(`${section.label} saved.`)
    } catch (saveError) {
      setError(errorMessage(saveError, `${section.label} was not saved.`))
    } finally {
      setSaving('')
    }
  }

  async function savePage(event) {
    event.preventDefault()
    if (!page) return
    setSaving('page')
    setError('')
    setMessage('')
    try {
      await ensureCsrf()
      const response = await api.put(`/api/v1/admin/pages/${page.id}`, {
        title: page.title,
        slug: page.slug,
        excerpt: page.excerpt || '',
        body: page.body || '',
        meta_title: page.meta_title || '',
        meta_description: page.meta_description || '',
        status: page.status,
      })
      setPage(response.data.data)
      setSavedPage(structuredClone(response.data.data))
      setMessage('Page text saved.')
    } catch (saveError) {
      setError(errorMessage(saveError, 'The page text was not saved.'))
    } finally {
      setSaving('')
    }
  }

  if (error && !blocks) return <Notice tone="error">{error}</Notice>
  if (!blocks) return <Spinner label={`Loading ${title.toLowerCase()}`} />

  const dirty = sections.some((section) => JSON.stringify(blocks[section.key]) !== JSON.stringify(saved[section.key]))
    || JSON.stringify(page) !== JSON.stringify(savedPage)
  const listKey = (section) => section.itemsKey || 'items'

  return (
    <div>
      <Seo title={title} path={seoPath} robots="noindex,nofollow" />
      <div className="sticky top-0 z-20 -mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface/95 px-4 py-3 sm:-mx-6 sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted">{dirty ? 'You have unsaved changes.' : 'All sections match the last save.'}</p>
        </div>
        <a className="inline-flex min-h-11 items-center rounded-full border border-line bg-white px-4 text-sm font-semibold" href={liveHref} target="_blank" rel="noopener noreferrer">View live page</a>
      </div>
      {message ? <Notice tone="success">{message}</Notice> : null}
      {error ? <div className="mt-3"><Notice tone="error">{error}</Notice></div> : null}
      <div className="mt-4 grid min-w-0 gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="min-w-0 lg:sticky lg:top-24 lg:self-start" aria-label={navLabel}>
          <ol className="flex gap-2 overflow-x-auto lg:block lg:space-y-1">
            {pageSlug ? <li><a className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm hover:bg-white" href={`#editor-${pageSlug}`}>Page text</a></li> : null}
            {sections.map((section) => (
              <li key={section.key}>
                <a className="inline-flex min-h-11 items-center whitespace-nowrap rounded-xl px-3 text-sm hover:bg-white" href={`#editor-${section.key}`}>{section.label}</a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="min-w-0 space-y-4">
          {pageSlug ? (
            <form id={`editor-${pageSlug}`} className="space-y-3 rounded-2xl bg-white p-4 sm:p-6" onSubmit={savePage}>
              <h2 className="text-xl font-semibold">Page text</h2>
              {pageHelp ? <p className="text-sm text-muted">{pageHelp}</p> : null}
              {page ? (
                <>
                  <Field label="Heading"><input className={inputClass} value={page.title || ''} onChange={(event) => setPage({ ...page, title: event.target.value })} /></Field>
                  <Field label="Summary"><textarea className={inputClass} value={page.excerpt || ''} onChange={(event) => setPage({ ...page, excerpt: event.target.value })} /></Field>
                  <Field label="Body"><textarea className={`${inputClass} min-h-32`} value={page.body || ''} onChange={(event) => setPage({ ...page, body: event.target.value })} /></Field>
                  <Field label="Meta title"><input className={inputClass} value={page.meta_title || ''} onChange={(event) => setPage({ ...page, meta_title: event.target.value })} /></Field>
                  <Field label="Meta description"><textarea className={inputClass} value={page.meta_description || ''} onChange={(event) => setPage({ ...page, meta_description: event.target.value })} /></Field>
                  <Field label="Status">
                    <select className={inputClass} value={page.status || 'draft'} onChange={(event) => setPage({ ...page, status: event.target.value })}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </Field>
                  <Button type="submit" variant="blue" disabled={saving === 'page'}>Save page text</Button>
                </>
              ) : <p className="text-sm text-muted">This page record is not in the CMS yet.</p>}
            </form>
          ) : null}
          {sections.map((section) => {
            const block = blocks[section.key]
            const rows = block.payload[listKey(section)] || []
            return (
              <section key={section.key} id={`editor-${section.key}`} className="scroll-mt-24 space-y-3 rounded-2xl bg-white p-4 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{section.label}</h2>
                    {section.help ? <p className="mt-1 text-sm text-muted">{section.help}</p> : null}
                  </div>
                  <label className="flex min-h-11 items-center gap-2 text-sm">
                    <input type="checkbox" checked={block.is_visible} onChange={(event) => updateBlock(section.key, { is_visible: event.target.checked })} />
                    Show on the website
                  </label>
                </div>
                {section.title ? (
                  <Field label="Heading"><input className={inputClass} value={block.payload.title || ''} onChange={(event) => updatePayload(section.key, { title: event.target.value })} /></Field>
                ) : null}
                {(section.fields || []).map((field) => (
                  <FieldControl
                    key={field[0]}
                    field={field}
                    value={block.payload[field[0]] || ''}
                    onError={setError}
                    onChange={(value) => updatePayload(section.key, { [field[0]]: value })}
                  />
                ))}
                {section.items ? (
                  <ItemList
                    label={section.itemsLabel || 'Items'}
                    fields={section.items}
                    rows={rows}
                    onError={setError}
                    onChange={(items) => updatePayload(section.key, { [listKey(section)]: items })}
                  />
                ) : null}
                {(section.lists || []).map((list) => (
                  <ItemList
                    key={list.key}
                    label={list.label}
                    fields={list.fields}
                    rows={block.payload[list.key] || []}
                    onError={setError}
                    onChange={(items) => updatePayload(section.key, { [list.key]: items })}
                  />
                ))}
                <Button type="button" variant="blue" disabled={saving === section.key} onClick={() => saveSection(section)}>Save {section.label}</Button>
              </section>
            )
          })}
          <p className="text-sm text-muted"><Link className="font-semibold text-blue" to="/admin/cms">Back to content</Link></p>
        </div>
      </div>
    </div>
  )
}
