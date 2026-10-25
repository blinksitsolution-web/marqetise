import { Link } from 'react-router-dom'
import Seo from '../../components/Seo'
import { useSite } from '../../context/useSite'

export default function AboutPage() {
  const { site, error } = useSite()
  const identity = site?.blocks?.['about.identity']?.payload
  const approach = site?.blocks?.['about.approach']?.payload
  const page = (site?.pages || []).find((item) => item.slug === 'about')

  return (
    <>
      <Seo title="About Us" description={page?.meta_description || identity?.body} path="/about" />
      <section className="bg-navy-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">About us</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold sm:text-5xl">{page?.title || identity?.title || 'About Us'}</h1>
          <p className="mt-4 max-w-2xl text-white/75">{identity?.body}</p>
        </div>
      </section>
      {error ? <p className="mx-auto max-w-6xl px-4 py-6 text-red-700" role="alert">{error}</p> : null}
      {page?.body ? <section className="mx-auto max-w-3xl px-4 py-10"><p className="whitespace-pre-line text-sm leading-7 text-muted">{page.body}</p></section> : null}
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-16 md:grid-cols-3">
        {[
          ['Mission', identity?.mission],
          ['Vision', identity?.vision],
        ].map(([title, body]) => (
          <article key={title} className="rounded-3xl border border-line p-6">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted">{body}</p>
          </article>
        ))}
        <article className="rounded-3xl border border-line p-6">
          <h2 className="text-lg font-semibold">Values</h2>
          <ul className="mt-3 space-y-3 text-sm text-muted">
            {(identity?.values || []).map((value) => <li key={value.title}><span className="font-semibold text-ink">{value.title}. </span>{value.body}</li>)}
          </ul>
        </article>
      </section>
      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-semibold">Our approach</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {(approach?.items || []).map((item) => (
              <article key={item.title} className="rounded-3xl bg-navy-900 p-6 text-white">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-white/70">{item.body}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-2xl text-sm text-muted">Team profiles, a company timeline, and awards are hidden until real entries are added in the CMS.</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-3xl bg-blue px-6 py-10 text-white sm:flex sm:items-center sm:justify-between">
          <h2 className="text-3xl font-semibold">Work with us, or learn with us.</h2>
          <div className="mt-5 flex gap-3 sm:mt-0">
            <Link to="/contact" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-blue">Contact us</Link>
            <Link to="/courses" className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold">Explore courses</Link>
          </div>
        </div>
      </section>
    </>
  )
}
