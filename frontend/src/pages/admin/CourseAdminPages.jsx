import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Seo from '../../components/Seo'
import { Badge, Button, EmptyState, Field, Notice, Pager, Spinner, inputClass, statusTone } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { api, can, ensureCsrf, errorMessage } from '../../services/api'
import { formatPrice } from '../../utils/format'

const blank = {
  title: '', slug: '', summary: '', description: '', category: 'Digital Marketing', level: 'Beginner', format: 'Online',
  duration_label: '', price: '', price_label: '', certificate_included: false, featured: false, status: 'draft',
  outcomes: '', instructor_name: '', instructor_title: '', instructor_bio: '', modules: [{ title: '', lessons: '' }],
}

export function CourseAdminListPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState(null)
  const [meta, setMeta] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    api.get(`/api/v1/admin/courses?search=${encodeURIComponent(search)}&page=${page}`).then((response) => {
      setRows(response.data.data || [])
      setMeta(response.data.meta || null)
    }).catch(() => setRows([]))
  }, [search, page])

  return (
    <>
      <Seo title="Courses" path="/admin/courses" robots="noindex,nofollow" />
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Courses</h1>
        {can(user, 'courses.manage') ? <Link to="/admin/courses/new" className="rounded-full bg-blue px-4 py-2 text-sm font-semibold text-white">Create course</Link> : null}
      </div>
      <input className={`${inputClass} mt-4 max-w-sm`} placeholder="Search courses" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} aria-label="Search courses" />
      {!rows ? <div className="mt-6"><Spinner /></div> : rows.length === 0 ? <div className="mt-6"><EmptyState title="No courses" body="Published courses are the only ones visitors can open." /></div> : (
        <div className="mt-4 overflow-x-auto rounded-2xl bg-white">
          <table className="record-table w-full text-left text-sm">
            <thead className="text-muted"><tr><th className="px-4 py-3">Course</th><th>Price</th><th>Status</th><th>Students</th><th /></tr></thead>
            <tbody>
              {rows.map((course) => (
                <tr key={course.id} className="border-t border-line">
                  <td className="px-4 py-3" data-label="Course"><p className="font-medium">{course.title}</p><p className="text-xs text-muted">{course.category} · {course.level}</p></td>
                  <td>{formatPrice(course)}</td>
                  <td><Badge tone={statusTone(course.status)}>{course.status}</Badge></td>
                  <td>{course.students_count ?? 0}</td>
                  <td className="px-4 text-right">{can(user, 'courses.manage') ? <Link className="font-semibold text-blue" to={`/admin/courses/${course.id}`}>Edit</Link> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager meta={meta} onPage={setPage} />
    </>
  )
}

export function CourseEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(blank)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(!id)

  useEffect(() => {
    if (!id) return
    api.get(`/api/v1/admin/courses/${id}`).then((response) => {
      const course = response.data.data
      setForm({
        ...course,
        price: course.price ?? '',
        outcomes: (course.outcomes || []).join('\n'),
        instructor_name: course.instructor_name || '',
        instructor_title: course.instructor_title || '',
        instructor_bio: course.instructor_bio || '',
        next_start_date: course.next_start_date ? String(course.next_start_date).slice(0, 10) : '',
        modules: (course.modules || [{ title: '', lessons: [] }]).map((module) => ({ title: module.title, lessons: (module.lessons || []).join('\n') })),
      })
      setReady(true)
    }).catch(() => setError('The course could not be loaded.'))
  }, [id])

  function update(key, value) {
    const next = { ...form, [key]: value }
    if (key === 'title' && !id) next.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    setForm(next)
  }

  async function save(event) {
    event.preventDefault()
    setError('')
    const payload = {
      ...form,
      price: form.price === '' ? null : Number(form.price),
      certificate_included: Boolean(form.certificate_included),
      featured: Boolean(form.featured),
      outcomes: String(form.outcomes || '').split('\n').map((line) => line.trim()).filter(Boolean),
      instructor_name: form.instructor_name || null,
      instructor_title: form.instructor_title || null,
      instructor_bio: form.instructor_bio || null,
      next_start_date: form.next_start_date || null,
      modules: form.modules.filter((module) => module.title).map((module) => ({
        title: module.title,
        lessons: String(module.lessons || '').split('\n').map((line) => line.trim()).filter(Boolean),
      })),
    }
    try {
      await ensureCsrf()
      if (id) await api.put(`/api/v1/admin/courses/${id}`, payload)
      else await api.post('/api/v1/admin/courses', payload)
      navigate('/admin/courses')
    } catch (saveError) {
      setError(errorMessage(saveError))
    }
  }

  async function removeCourse() {
    if (!id || !window.confirm('Delete this course? This cannot be undone.')) return
    setError('')
    try {
      await ensureCsrf()
      await api.delete(`/api/v1/admin/courses/${id}`)
      navigate('/admin/courses')
    } catch (deleteError) {
      setError(errorMessage(deleteError, 'The course was not deleted.'))
    }
  }

  if (!ready) return <Spinner />

  return (
    <form className="mx-auto max-w-3xl space-y-4" onSubmit={save}>
      <Seo title="Course editor" path="/admin/courses" robots="noindex,nofollow" />
      <h1 className="text-2xl font-semibold">{id ? 'Edit course' : 'New course'}</h1>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Field label="Title"><input className={inputClass} value={form.title} onChange={(event) => update('title', event.target.value)} /></Field>
      <Field label="Slug"><input className={inputClass} value={form.slug} onChange={(event) => update('slug', event.target.value)} /></Field>
      <Field label="Summary"><textarea className={inputClass} value={form.summary} onChange={(event) => update('summary', event.target.value)} /></Field>
      <Field label="Description"><textarea className={`${inputClass} min-h-32`} value={form.description || ''} onChange={(event) => update('description', event.target.value)} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category"><input className={inputClass} value={form.category} onChange={(event) => update('category', event.target.value)} /></Field>
        <Field label="Level"><select className={inputClass} value={form.level} onChange={(event) => update('level', event.target.value)}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></Field>
        <Field label="Format"><input className={inputClass} value={form.format} onChange={(event) => update('format', event.target.value)} /></Field>
        <Field label="Duration"><input className={inputClass} value={form.duration_label || ''} onChange={(event) => update('duration_label', event.target.value)} /></Field>
        <Field label="Price"><input className={inputClass} value={form.price} onChange={(event) => update('price', event.target.value)} /></Field>
        <Field label="Price label"><input className={inputClass} value={form.price_label || ''} onChange={(event) => update('price_label', event.target.value)} /></Field>
      </div>
      <Field label="Outcomes, one per line"><textarea className={inputClass} value={form.outcomes} onChange={(event) => update('outcomes', event.target.value)} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Instructor name"><input className={inputClass} value={form.instructor_name || ''} onChange={(event) => update('instructor_name', event.target.value)} /></Field>
        <Field label="Instructor title"><input className={inputClass} value={form.instructor_title || ''} onChange={(event) => update('instructor_title', event.target.value)} /></Field>
        <Field label="Next start date"><input className={inputClass} type="date" value={form.next_start_date || ''} onChange={(event) => update('next_start_date', event.target.value)} /></Field>
      </div>
      <Field label="Instructor bio"><textarea className={inputClass} value={form.instructor_bio || ''} onChange={(event) => update('instructor_bio', event.target.value)} /></Field>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={Boolean(form.featured)} onChange={(event) => update('featured', event.target.checked)} /> Featured</label>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={Boolean(form.certificate_included)} onChange={(event) => update('certificate_included', event.target.checked)} /> Certificate included</label>
      <Field label="Status"><select className={inputClass} value={form.status} onChange={(event) => update('status', event.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></Field>
      <div className="space-y-3">
        <h2 className="font-semibold">Modules</h2>
        {form.modules.map((module, index) => (
          <div key={index} className="rounded-2xl border border-line p-3">
            <input className={inputClass} placeholder="Module title" value={module.title} onChange={(event) => {
              const modules = [...form.modules]
              modules[index] = { ...module, title: event.target.value }
              update('modules', modules)
            }} />
            <textarea className={`${inputClass} mt-2`} placeholder="Lessons, one per line" value={module.lessons} onChange={(event) => {
              const modules = [...form.modules]
              modules[index] = { ...module, lessons: event.target.value }
              update('modules', modules)
            }} />
            <button type="button" className="mt-2 text-sm text-red-700" onClick={() => update('modules', form.modules.filter((_, moduleIndex) => moduleIndex !== index))}>Remove module</button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => update('modules', [...form.modules, { title: '', lessons: '' }])}>Add module</Button>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="blue">Save course</Button>
        {id ? <Button type="button" variant="danger" onClick={removeCourse}>Delete course</Button> : null}
      </div>
    </form>
  )
}
