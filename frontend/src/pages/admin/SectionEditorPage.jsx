import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Seo from '../../components/Seo'
import { MediaImageField, flushImageFields } from '../../components/MediaImageField'
import { MediaVideoField } from '../../components/MediaVideoField'
import { saveErrorAlert, savedAlert } from '../../components/saveAlert'
import { Button, Field, Notice, Spinner, inputClass } from '../../components/ui'
import { api, ensureCsrf, errorMessage } from '../../services/api'
import { emptyItem, fieldPatch, imageFlags, sectionPayload } from './homeSections'

function move(items, index, direction) {
  const target = index + direction
  if (target < 0 || target >= items.length) return items
  const next = items.slice()
  const [row] = next.splice(index, 1)
  next.splice(target, 0, row)
  return next
}

function failureText(saveError, fallback) {
  if (saveError?.response) return errorMessage(saveError, fallback)
  return saveError?.message || fallback
}

function FieldControl({ field, value, onChange, onError, scope, videoRemoved = false }) {
  const [key, label, type = 'text'] = field
  if (type === 'image') {
    return <MediaImageField scope={scope} label={label} value={value || ''} onChange={onChange} onError={onError} />
  }
  if (type === 'video') {
    return <MediaVideoField scope={scope} label={label} value={value || ''} removed={videoRemoved} onChange={onChange} onError={onError} />
  }
  const hint = key === 'video_label'
    ? 'The words around the play button. Leave this blank to keep the template circle.'
    : key === 'href' || key.endsWith('_href')
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

function ItemList({ label, fields, rows, onChange, onError, scope }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{label}</p>
      {rows.map((item, index) => (
        <div key={`${label}-${index}`} className="space-y-2 rounded-2xl border border-line p-3">
          {fields.map((field) => (
            <FieldControl
              key={field[0]}
              field={field}
              scope={scope}
              value={item[field[0]] || ''}
              onError={onError}
              onChange={(value) => onChange((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...imageFlags(field, value) } : row))}
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
  const blocksRef = useRef(null)
  const [saved, setSaved] = useState(null)
  const [page, setPage] = useState(null)
  const pageRef = useRef(null)
  const [savedPage, setSavedPage] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

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
      blocksRef.current = next
      pageRef.current = record
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
    const current = blocksRef.current
    const next = { ...current, [key]: { ...current[key], ...patch } }
    blocksRef.current = next
    setBlocks(next)
  }

  function updatePayload(key, patch) {
    const current = blocksRef.current
    const next = {
      ...current,
      [key]: { ...current[key], payload: { ...current[key].payload, ...patch } },
    }
    blocksRef.current = next
    setBlocks(next)
  }

  function updateItems(key, listKey, update) {
    const current = blocksRef.current
    const rows = current[key].payload[listKey] || []
    const items = typeof update === 'function' ? update(rows) : update
    updatePayload(key, { [listKey]: items })
  }

  function replacePage(next) {
    pageRef.current = next
    setPage(next)
  }

  async function persistSection(section) {
    const block = blocksRef.current[section.key]
    const body = {
      key: section.key,
      group: section.group || defaultGroup,
      label: block.label || section.label,
      payload: block.payload,
      is_visible: Boolean(block.is_visible),
      sort_order: block.sort_order || 0,
    }
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
    blocksRef.current = { ...blocksRef.current, [section.key]: next }
    setBlocks(blocksRef.current)
    setSaved((current) => ({ ...current, [section.key]: structuredClone(next) }))
    return section.label
  }

  async function persistPage() {
    const current = pageRef.current
    if (!current) return null
    await ensureCsrf()
    const response = await api.put(`/api/v1/admin/pages/${current.id}`, {
      title: current.title,
      slug: current.slug,
      excerpt: current.excerpt || '',
      body: current.body || '',
      meta_title: current.meta_title || '',
      meta_description: current.meta_description || '',
      status: current.status,
    })
    pageRef.current = response.data.data
    setPage(response.data.data)
    setSavedPage(structuredClone(response.data.data))
    return 'Page text'
  }

  async function saveAll() {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await flushImageFields()
    } catch (flushError) {
      const text = flushError.message || 'The image was not uploaded.'
      setError(text)
      setSaving(false)
      saveErrorAlert([text])
      return
    }

    const savedSnapshot = saved
    const dirtySections = sections.filter((section) => JSON.stringify(blocksRef.current[section.key]) !== JSON.stringify(savedSnapshot?.[section.key]))
    const pageDirty = Boolean(pageRef.current && JSON.stringify(pageRef.current) !== JSON.stringify(savedPage))
    const savedLabels = []
    const failures = []

    for (const section of dirtySections) {
      try {
        savedLabels.push(await persistSection(section))
      } catch (saveError) {
        failures.push(`${section.label}: ${failureText(saveError, 'was not saved.')}`)
      }
    }
    if (pageDirty) {
      try {
        const label = await persistPage()
        if (label) savedLabels.push(label)
      } catch (saveError) {
        failures.push(`Page text: ${failureText(saveError, 'was not saved.')}`)
      }
    }

    setSaving(false)
    if (failures.length) {
      const lines = []
      if (savedLabels.length) lines.push(`Saved: ${savedLabels.join(', ')}.`)
      lines.push(...failures)
      setError(failures.join(' '))
      saveErrorAlert(lines)
      return
    }
    setMessage('Saved.')
    savedAlert()
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
        <div className="flex flex-wrap items-center gap-3">
          <a className="inline-flex min-h-11 items-center rounded-full border border-line bg-white px-4 text-sm font-semibold" href={liveHref} target="_blank" rel="noopener noreferrer">View live page</a>
          <Button type="button" variant="blue" disabled={saving} onClick={saveAll}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
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
            <div id={`editor-${pageSlug}`} className="space-y-3 rounded-2xl bg-white p-4 sm:p-6">
              <h2 className="text-xl font-semibold">Page text</h2>
              {pageHelp ? <p className="text-sm text-muted">{pageHelp}</p> : null}
              {page ? (
                <>
                  <Field label="Heading"><input className={inputClass} value={page.title || ''} onChange={(event) => replacePage({ ...pageRef.current, title: event.target.value })} /></Field>
                  <Field label="Summary"><textarea className={inputClass} value={page.excerpt || ''} onChange={(event) => replacePage({ ...pageRef.current, excerpt: event.target.value })} /></Field>
                  <Field label="Body"><textarea className={`${inputClass} min-h-32`} value={page.body || ''} onChange={(event) => replacePage({ ...pageRef.current, body: event.target.value })} /></Field>
                  <Field label="Meta title"><input className={inputClass} value={page.meta_title || ''} onChange={(event) => replacePage({ ...pageRef.current, meta_title: event.target.value })} /></Field>
                  <Field label="Meta description"><textarea className={inputClass} value={page.meta_description || ''} onChange={(event) => replacePage({ ...pageRef.current, meta_description: event.target.value })} /></Field>
                  <Field label="Status">
                    <select className={inputClass} value={page.status || 'draft'} onChange={(event) => replacePage({ ...pageRef.current, status: event.target.value })}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </Field>
                </>
              ) : <p className="text-sm text-muted">This page record is not in the CMS yet.</p>}
            </div>
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
                    scope={section.key}
                    value={block.payload[field[0]] || ''}
                    videoRemoved={block.payload.video_removed === true}
                    onError={setError}
                    onChange={(value) => updatePayload(section.key, fieldPatch(field, value))}
                  />
                ))}
                {section.items ? (
                  <ItemList
                    label={section.itemsLabel || 'Items'}
                    fields={section.items}
                    rows={rows}
                    scope={section.key}
                    onError={setError}
                    onChange={(items) => updateItems(section.key, listKey(section), items)}
                  />
                ) : null}
                {(section.lists || []).map((list) => (
                  <ItemList
                    key={list.key}
                    label={list.label}
                    fields={list.fields}
                    rows={block.payload[list.key] || []}
                    scope={section.key}
                    onError={setError}
                    onChange={(items) => updateItems(section.key, list.key, items)}
                  />
                ))}
              </section>
            )
          })}
          <p className="text-sm text-muted"><Link className="font-semibold text-blue" to="/admin/cms">Back to content</Link></p>
        </div>
      </div>
    </div>
  )
}
