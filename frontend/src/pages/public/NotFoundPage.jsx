import { Link } from 'react-router-dom'
import Seo from '../../components/Seo'

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <Seo title="Page not found" path="/" robots="noindex,follow" />
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 text-sm text-muted">That address is not a published page.</p>
      <div className="mt-6 flex justify-center gap-4">
        <Link to="/" className="inline-flex min-h-11 items-center text-sm font-semibold text-blue">Back home</Link>
        <Link to="/contact" className="inline-flex min-h-11 items-center text-sm font-semibold text-blue">Contact</Link>
      </div>
    </div>
  )
}
