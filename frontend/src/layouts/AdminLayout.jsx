import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Brand from '../components/Brand'
import { useDialog } from '../components/useDialog'
import { useAuth } from '../context/useAuth'
import { api, can } from '../services/api'

const cmsPages = [
  { to: '/admin/cms/home', label: 'Home' },
  { to: '/admin/cms/about', label: 'About' },
  { to: '/admin/cms/services', label: 'Services' },
  { to: '/admin/cms/courses', label: 'Courses' },
  { to: '/admin/cms/projects', label: 'Projects' },
  { to: '/admin/cms/team', label: 'Team' },
  { to: '/admin/cms/news', label: 'News' },
  { to: '/admin/cms/testimonials', label: 'Testimonials' },
  { to: '/admin/cms/faq', label: 'FAQ' },
  { to: '/admin/cms/contact', label: 'Contact' },
  { to: '/admin/cms/book', label: 'Booking' },
  { to: '/admin/cms/packages', label: 'Packages' },
  { to: '/admin/cms/chrome', label: 'Header & Footer' },
  { to: '/admin/cms/privacy', label: 'Privacy' },
  { to: '/admin/cms/terms', label: 'Terms' },
  { to: '/admin/cms', label: 'All content', end: true },
]

const items = [
  { to: '/admin', label: 'Dashboard', permission: 'dashboard.view', end: true },
  { to: '/admin/cms', label: 'CMS', permission: 'content.view', menu: 'cms' },
  { to: '/admin/courses', label: 'Courses', permission: 'courses.view' },
  { to: '/admin/inquiries', label: 'Inquiries', permission: 'inquiries.view' },
  { to: '/admin/bookings', label: 'Bookings', permission: 'bookings.view' },
  { to: '/admin/students', label: 'Students', permission: 'students.view' },
  { to: '/admin/users', label: 'Users', permission: 'users.view' },
  { to: '/admin/permissions', label: 'Permissions', permission: 'roles.view' },
  { to: '/admin/settings', label: 'Settings', permission: 'settings.view' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const drawerRef = useDialog(open, () => setOpen(false))
  const visible = items.filter((item) => can(user, item.permission))

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) return undefined
    const timer = setTimeout(() => {
      api.get(`/api/v1/admin/search?q=${encodeURIComponent(term)}`)
        .then((response) => setResults(response.data.data || {}))
        .catch(() => setResults({}))
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  async function signOut() {
    await logout()
    navigate('/admin/login')
  }

  const nav = (
    <nav className="space-y-1" aria-label="Admin">
      {visible.map((item) => (
        item.menu === 'cms'
          ? <CmsMenu key="cms" onNavigate={() => setOpen(false)} />
          : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `flex min-h-11 items-center rounded-xl px-3 text-sm font-medium ${isActive ? 'bg-blue/10 text-blue' : 'text-ink hover:bg-surface'}`}
            >
              {item.label}
            </NavLink>
          )
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-surface text-ink">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-white p-4 lg:flex">
          <Link to="/" className="mb-6 px-2"><Brand light /></Link>
          {nav}
          <p className="mt-auto px-2 pt-6 text-xs text-muted">Access is checked on the server for every request.</p>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="flex items-center gap-2 border-b border-line bg-white px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
            <button type="button" className="inline-flex min-h-11 shrink-0 items-center rounded-xl border border-line px-3 text-sm lg:hidden" onClick={() => setOpen(true)}>Menu</button>
            <label className="relative min-w-0 flex-1 text-sm">
              <span className="sr-only">Search admin records</span>
              <input className="w-full rounded-xl border border-line px-3 py-2" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records" />
              {query.trim().length >= 2 && results ? <SearchResults results={results} onPick={() => { setQuery(''); setResults(null) }} /> : null}
            </label>
            <Link to="/admin/account" className="hidden max-w-36 shrink-0 text-right sm:block">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="truncate text-xs text-muted">{user?.role?.name}</p>
            </Link>
            <Link to="/admin/account" className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold sm:hidden">Account</Link>
            <button type="button" className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-line px-3 text-sm sm:px-4" onClick={signOut}>Sign out</button>
          </header>
          <main className="p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 bg-navy-950/40 lg:hidden" onClick={() => setOpen(false)}>
          <aside ref={drawerRef} role="dialog" aria-modal="true" aria-label="Admin menu" tabIndex={-1} className="h-full w-72 bg-white p-4" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <Brand light />
              <button type="button" className="inline-flex min-h-11 items-center px-3" onClick={() => setOpen(false)} aria-label="Close menu">Close</button>
            </div>
            {nav}
          </aside>
        </div>
      ) : null}
    </div>
  )
}

function CmsMenu({ onNavigate }) {
  const location = useLocation()
  const buttonRef = useRef(null)
  const listRef = useRef(null)
  const onCms = location.pathname === '/admin/cms' || location.pathname.startsWith('/admin/cms/')
  const [expanded, setExpanded] = useState(onCms)
  const [trackedPath, setTrackedPath] = useState(location.pathname)
  if (location.pathname !== trackedPath) {
    setTrackedPath(location.pathname)
    if (onCms) setExpanded(true)
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      setExpanded(false)
      buttonRef.current?.focus()
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setExpanded(true)
      queueMicrotask(() => listRef.current?.querySelector('a')?.focus())
    }
  }

  return (
    <div>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={expanded}
        aria-controls="cms-page-menu"
        onClick={() => setExpanded((value) => !value)}
        onKeyDown={onKeyDown}
        className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-medium ${onCms ? 'bg-blue/10 text-blue' : 'text-ink hover:bg-surface'}`}
      >
        CMS
        <span aria-hidden="true">{expanded ? '▾' : '▸'}</span>
      </button>
      <ul id="cms-page-menu" ref={listRef} hidden={!expanded} aria-label="CMS pages" className="mt-1 space-y-1 border-l border-line pl-2">
        {cmsPages.map((page) => (
          <li key={page.label}>
            <NavLink
              to={page.to}
              end={page.end}
              onClick={onNavigate}
              className={({ isActive }) => `flex min-h-11 items-center rounded-xl px-3 text-sm ${isActive ? 'bg-blue/10 font-semibold text-blue' : 'text-ink hover:bg-surface'}`}
            >
              {page.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SearchResults({ results, onPick }) {
  const groups = [
    ['students', 'Students', (row) => ({ to: `/admin/students/${row.id}`, label: row.name })],
    ['courses', 'Courses', (row) => ({ to: `/admin/courses/${row.id}`, label: row.title })],
    ['pages', 'Pages', (row) => ({ to: `/admin/cms/pages/${row.id}`, label: row.title })],
    ['inquiries', 'Inquiries', (row) => ({ to: `/admin/inquiries/${row.id}`, label: row.subject })],
    ['bookings', 'Bookings', (row) => ({ to: `/admin/bookings/${row.id}`, label: row.reference })],
  ].filter(([key]) => Array.isArray(results[key]) && results[key].length > 0)

  return (
    <div className="absolute left-0 right-0 top-12 z-30 max-h-80 overflow-auto rounded-2xl border border-line bg-white p-2 shadow-xl">
      {groups.length === 0 ? <p className="px-3 py-2 text-sm text-muted">No matching records.</p> : groups.map(([key, title, linkFor]) => (
        <div key={key} className="mb-2">
          <p className="px-3 py-1 text-xs font-semibold uppercase text-muted">{title}</p>
          {results[key].map((row) => {
            const link = linkFor(row)
            return <Link key={`${key}-${row.id}`} to={link.to} className="flex min-h-11 items-center rounded-xl px-3 text-sm hover:bg-surface" onClick={onPick}>{link.label}</Link>
          })}
        </div>
      ))}
    </div>
  )
}
