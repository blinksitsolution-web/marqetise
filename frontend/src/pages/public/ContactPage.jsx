import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import { GHANA_PHONE_HINT, GHANA_PHONE_PLACEHOLDER, ghanaDisplay } from '../../components/ghanaPhone'
import Seo from '../../components/Seo'
import { Button, Field, Notice, inputClass } from '../../components/ui'
import { useSite } from '../../context/SiteContext'
import { enquiryTypes, inquirySchema } from '../../schemas/forms'
import { api, ensureCsrf, errorMessage } from '../../services/api'

export default function ContactPage() {
  const { site } = useSite()
  const [params] = useSearchParams()
  const [courses, setCourses] = useState([])
  const [courseError, setCourseError] = useState('')
  const [status, setStatus] = useState(null)
  const settings = site?.settings || {}
  const hero = site?.blocks?.['contact.hero']?.payload
  const faqs = site?.faqs?.contact || []
  const requestedType = params.get('enquiry') || params.get('type') || 'other'
  const typeAliases = { contact: 'other', corporate: 'corporate_training' }
  const initialType = enquiryTypes.some(([value]) => value === requestedType)
    ? requestedType
    : (typeAliases[requestedType] || 'other')
  const form = useForm({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      type: initialType,
      name: '',
      email: '',
      phone: '',
      subject: params.get('subject') || '',
      message: '',
      course: params.get('course') || '',
      consent: false,
      hp_field: '',
    },
  })

  useEffect(() => {
    api.get('/api/v1/courses?per_page=24').then((response) => setCourses(response.data.data || [])).catch(() => setCourseError('Courses could not be loaded.'))
  }, [])

  async function onSubmit(values) {
    setStatus(null)
    try {
      await ensureCsrf()
      const response = await api.post('/api/v1/inquiries', {
        ...values,
        course: values.type === 'course' ? values.course : null,
        phone: values.phone || null,
      })
      setStatus({ tone: 'success', text: response.data.message })
      form.reset({ ...values, message: '', subject: '', consent: false })
    } catch (error) {
      setStatus({ tone: 'error', text: errorMessage(error, 'Your message was not saved.') })
    }
  }

  return (
    <>
      <Seo title="Contact" description={hero?.subcopy} path="/contact" />
      <section className="bg-navy-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="max-w-3xl text-4xl font-semibold sm:text-5xl">{hero?.headline || 'Let’s talk about the work'}</h1>
          <p className="mt-4 max-w-2xl text-white/75">{hero?.subcopy}</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1.3fr_.7fr]">
        <form className="space-y-4 rounded-3xl border border-line p-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <h2 className="text-2xl font-semibold">Send a message</h2>
          {status ? <Notice tone={status.tone}>{status.text}</Notice> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" error={form.formState.errors.name?.message}>
              <input className={inputClass} {...form.register('name')} />
            </Field>
            <Field label="Email" error={form.formState.errors.email?.message}>
              <input className={inputClass} type="email" {...form.register('email')} />
            </Field>
            <Field label="Phone" hint={GHANA_PHONE_HINT} error={form.formState.errors.phone?.message}>
              <input className={inputClass} type="tel" inputMode="tel" autoComplete="tel" placeholder={GHANA_PHONE_PLACEHOLDER} {...form.register('phone')} />
            </Field>
            <Field label="Enquiry type" error={form.formState.errors.type?.message}>
              <select className={inputClass} {...form.register('type')}>
                {enquiryTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
          </div>
          {form.watch('type') === 'course' ? (
            <>
              {courseError ? <p className="text-sm text-red-700" role="alert">{courseError}</p> : null}
              <Field label="Course" error={form.formState.errors.course?.message}>
                <select className={inputClass} {...form.register('course')}>
                  <option value="">Select a course</option>
                  {courses.map((course) => <option key={course.id} value={course.slug}>{course.title}</option>)}
                </select>
              </Field>
            </>
          ) : null}
          <Field label="Subject" error={form.formState.errors.subject?.message}>
            <input className={inputClass} {...form.register('subject')} />
          </Field>
          <Field label="Message" error={form.formState.errors.message?.message}>
            <textarea className={`${inputClass} min-h-32`} {...form.register('message')} />
          </Field>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" {...form.register('consent')} />
            <span>I agree to be contacted about this enquiry.</span>
          </label>
          {form.formState.errors.consent ? <p className="text-sm text-red-700" role="alert">{form.formState.errors.consent.message}</p> : null}
          <input className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" {...form.register('hp_field')} />
          <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Sending…' : 'Send message'}</Button>
        </form>
        <aside className="space-y-4">
          <div className="rounded-3xl bg-surface p-6 text-sm">
            <h2 className="text-lg font-semibold">Contact details</h2>
            <ul className="mt-4 space-y-2 text-muted">
              {settings.email ? <li>{settings.email}</li> : null}
              {settings.phone ? <li>{ghanaDisplay(settings.phone)}</li> : null}
              {settings.address ? <li>{settings.address}</li> : null}
              {settings.hours ? <li>{settings.hours}</li> : null}
              {!settings.email && !settings.phone && !settings.address ? <li>Contact details have not been published yet. The form still saves your message.</li> : null}
            </ul>
          </div>
          <div className="rounded-3xl border border-line p-6 text-sm">
            <h2 className="text-lg font-semibold">Book a call</h2>
            <p className="mt-2 text-muted">A booking request stays pending until a person confirms the time.</p>
            <Link to="/book" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-blue px-5 text-sm font-semibold text-white">Book a call</Link>
          </div>
          {settings.address ? (
            <div className="rounded-3xl border border-line p-6 text-sm">
              <h2 className="text-lg font-semibold">Location</h2>
              <p className="mt-2 text-muted">{settings.address}</p>
            </div>
          ) : null}
          {faqs.map((faq) => (
            <article key={faq.question} className="rounded-3xl border border-line p-5">
              <h3 className="font-semibold">{faq.question}</h3>
              <p className="mt-2 text-sm text-muted">{faq.answer}</p>
            </article>
          ))}
        </aside>
      </section>
    </>
  )
}
