import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import Brand from '../components/Brand'
import { useAuth } from '../context/AuthContext'
import { can } from '../services/api'

const items = [
  { to: '/admin', label: 'Dashboard', permission: 'dashboard.view', end: true },
  { to: '/admin/cms', label: 'CMS', permission: 'content.view' },
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
  const visible = items.filter((item) => can(user, item.permission))

  async function signOut() {
    await logout()
    navigate('/admin/login')
  }

  const nav = (
    <nav className="space-y-1" aria-label="Admin">
      {visible.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setOpen(false)}
          className={({ isActive }) => `block rounded-xl px-3 py-2 text-sm font-medium ${isActive ? 'bg-blue/10 text-blue' : 'text-ink hover:bg-surface'}`}
        >
          {item.label}
        </NavLink>
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
          <header className="flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-3">
            <button type="button" className="rounded-xl border border-line px-3 py-2 text-sm lg:hidden" onClick={() => setOpen(true)}>Menu</button>
            <p className="hidden text-sm text-muted sm:block">Admin</p>
            <div className="ml-auto flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold">{user?.name}</p>
                <p className="text-xs text-muted">{user?.role?.name}</p>
              </div>
              <button type="button" className="rounded-full border border-line px-3 py-2 text-sm" onClick={signOut}>Sign out</button>
            </div>
          </header>
          <div className="p-4 sm:p-6">
            <Outlet />
          </div>
        </div>
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 bg-navy-950/40 lg:hidden" onClick={() => setOpen(false)}>
          <aside className="h-full w-72 bg-white p-4" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <Brand light />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">Close</button>
            </div>
            {nav}
          </aside>
        </div>
      ) : null}
    </div>
  )
}
