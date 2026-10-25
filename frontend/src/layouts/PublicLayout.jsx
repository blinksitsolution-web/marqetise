import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import Brand from '../components/Brand'
import { useSite } from '../context/useSite'
import { hasPublishedPage } from '../utils/pages'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About Us' },
  { to: '/services', label: 'Services' },
  { to: '/courses', label: 'Courses' },
  { to: '/contact', label: 'Contact Us' },
  { to: '/contact', label: 'Get Started' },
]

const year = new Date().getFullYear()

function navClass({ isActive }) {
  return `inline-flex min-h-11 items-center rounded-full px-3 text-sm ${isActive ? 'bg-white/10 text-white' : 'text-white/75 hover:text-white'}`
}

export default function PublicLayout() {
  const { site } = useSite()
  const [open, setOpen] = useState(false)
  const settings = site?.settings || {}

  return (
    <div className="min-h-screen bg-white">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2">Skip to content</a>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-900/95 text-white backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" aria-label="Marqetise home"><Brand /></Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {links.map((link) => <NavLink key={link.label} to={link.to} end={link.end} className={navClass}>{link.label}</NavLink>)}
            <Link to="/admin/login" className="inline-flex min-h-11 items-center px-3 text-sm text-white/70">Admin login</Link>
            <Link to="/book" className="inline-flex min-h-11 items-center rounded-full bg-blue px-4 text-sm font-semibold text-white">Book a service</Link>
          </nav>
          <button type="button" className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-4 text-sm lg:hidden" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            Menu
          </button>
        </div>
        {open ? (
          <nav className="space-y-1 border-t border-white/10 px-4 py-3 lg:hidden" aria-label="Mobile">
            {links.map((link) => <NavLink key={link.label} to={link.to} end={link.end} className="flex min-h-11 items-center rounded-xl px-3" onClick={() => setOpen(false)}>{link.label}</NavLink>)}
            <Link to="/admin/login" className="flex min-h-11 items-center px-3 text-white/70" onClick={() => setOpen(false)}>Admin login</Link>
            <Link to="/book" className="mt-2 flex min-h-11 items-center justify-center rounded-full bg-blue px-4 font-semibold" onClick={() => setOpen(false)}>Book a service</Link>
          </nav>
        ) : null}
      </header>
      <main id="content">
        <Outlet />
      </main>
      <footer className="bg-navy-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Brand />
            <p className="mt-4 text-sm text-white/70">{settings.tagline || 'Digital marketing services and training.'}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Company</h2>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/services">Services</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Courses</h2>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              {(site?.featured_courses?.data || site?.featured_courses || []).slice(0, 4).map((course) => (
                <li key={course.id}><Link to={`/courses/${course.slug}`}>{course.title}</Link></li>
              ))}
              <li><Link to="/courses">All courses</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Contact</h2>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              {settings.email ? <li><a href={`mailto:${settings.email}`}>{settings.email}</a></li> : null}
              {settings.phone ? <li><a href={`tel:${settings.phone}`}>{settings.phone}</a></li> : null}
              {settings.address ? <li>{settings.address}</li> : null}
              {settings.hours ? <li>{settings.hours}</li> : null}
              {!settings.email && !settings.phone ? <li>Add contact details in Admin settings.</li> : null}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-white/50">
            <p>© {year} Marqetise</p>
            <div className="flex gap-4">
              {hasPublishedPage(site, 'privacy') ? <Link to="/privacy">Privacy</Link> : null}
              {hasPublishedPage(site, 'terms') ? <Link to="/terms">Terms</Link> : null}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
