import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { GHANA_PHONE_HINT, GHANA_PHONE_PLACEHOLDER } from '../../components/ghanaPhone'
import Seo from '../../components/Seo'
import { Button, Field, Notice, inputClass } from '../../components/ui'
import { bookingSchema } from '../../schemas/forms'
import { api, ensureCsrf, errorMessage } from '../../services/api'
import { BOOKING_TIMES, toIsoDate, weekdaySlots } from '../../utils/format'

export default function BookPage() {
  const { slug } = useParams()
  const [services, setServices] = useState([])
  const [serviceError, setServiceError] = useState('')
  const [month, setMonth] = useState(() => new Date())
  const [status, setStatus] = useState(null)
  const form = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      service_id: '', name: '', email: '', phone: '', company: '', website: '', budget: '',
      goals: '', format: 'video', preferred_date: '', preferred_time: '', consent: false, hp_field: '',
    },
  })

  useEffect(() => {
    let active = true
    api.get('/api/v1/services').then((response) => {
      if (!active) return
      const rows = response.data.data || []
      setServices(rows)
      const match = rows.find((service) => service.slug === slug)
      if (match) form.setValue('service_id', String(match.id))
    }).catch(() => {
      if (active) setServiceError('Services could not be loaded.')
    })
    return () => {
      active = false
    }
  }, [slug, form.setValue])

  const days = useMemo(() => weekdaySlots(month), [month])
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  async function onSubmit(values) {
    setStatus(null)
    try {
      await ensureCsrf()
      const response = await api.post('/api/v1/bookings', {
        ...values,
        service_id: Number(values.service_id),
        phone: values.phone || null,
        company: values.company || null,
        website: values.website || null,
        budget: values.budget || null,
      })
      setStatus({ tone: 'success', text: `${response.data.message} Reference ${response.data.data.reference}.` })
      form.reset()
    } catch (error) {
      setStatus({ tone: 'error', text: errorMessage(error, 'The booking request was not saved.') })
    }
  }

  return (
    <>
      <Seo title="Book a service" description="Request a strategy call. The time is pending until the team confirms it." path="/book" />
      <section className="bg-navy-950 px-4 py-14 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-semibold">Book a service or a strategy call</h1>
          <p className="mt-3 max-w-2xl text-white/75">Choose a service and a weekday. Submitting this form creates a pending request. It does not confirm the appointment.</p>
        </div>
      </section>
      <form className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.2fr_.8fr]" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="space-y-6">
          {status ? <Notice tone={status.tone}>{status.text}</Notice> : null}
          <fieldset>
            <legend className="text-lg font-semibold">Service</legend>
            {serviceError ? <p className="mt-2 text-sm text-red-700" role="alert">{serviceError}</p> : null}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {services.map((service) => (
                <label key={service.id} className={`rounded-2xl border p-4 ${form.watch('service_id') === String(service.id) ? 'border-brand' : 'border-line'}`}>
                  <input type="radio" className="sr-only" value={service.id} {...form.register('service_id')} />
                  <span className="font-semibold">{service.name}</span>
                  <span className="mt-1 block text-sm text-muted">{service.summary}</span>
                </label>
              ))}
            </div>
            {form.formState.errors.service_id ? <p className="mt-2 text-sm text-red-700" role="alert">{form.formState.errors.service_id.message}</p> : null}
          </fieldset>
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{month.toLocaleString('en-GB', { month: 'long', year: 'numeric' })}</h2>
              <div className="flex gap-2">
                <button type="button" className="inline-flex min-h-11 items-center rounded-full border border-line px-4" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>Prev</button>
                <button type="button" className="inline-flex min-h-11 items-center rounded-full border border-line px-4" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>Next</button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-muted">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {days.map((date) => {
                const iso = toIsoDate(date)
                const disabled = date < today || date.getDay() === 0 || date.getDay() === 6 || date.getMonth() !== month.getMonth()
                const selected = form.watch('preferred_date') === iso
                return (
                  <button
                    key={iso + date.getMonth()}
                    type="button"
                    disabled={disabled}
                    onClick={() => form.setValue('preferred_date', iso, { shouldValidate: true })}
                    className={`min-h-11 rounded-xl py-2 text-sm ${selected ? 'bg-blue text-white' : 'bg-surface'} disabled:opacity-30`}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
            {form.formState.errors.preferred_date ? <p className="mt-2 text-sm text-red-700" role="alert">{form.formState.errors.preferred_date.message}</p> : null}
          </div>
          <Field label="Time" error={form.formState.errors.preferred_time?.message}>
            <select className={inputClass} {...form.register('preferred_time')}>
              <option value="">Choose a time</option>
              {BOOKING_TIMES.map((time) => <option key={time}>{time}</option>)}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={form.formState.errors.name?.message}><input className={inputClass} {...form.register('name')} /></Field>
            <Field label="Email" error={form.formState.errors.email?.message}><input className={inputClass} type="email" {...form.register('email')} /></Field>
            <Field label="Phone" hint={GHANA_PHONE_HINT} error={form.formState.errors.phone?.message}><input className={inputClass} type="tel" inputMode="tel" autoComplete="tel" placeholder={GHANA_PHONE_PLACEHOLDER} {...form.register('phone')} /></Field>
            <Field label="Company"><input className={inputClass} {...form.register('company')} /></Field>
            <Field label="Website" error={form.formState.errors.website?.message}><input className={inputClass} {...form.register('website')} /></Field>
            <Field label="Budget"><input className={inputClass} {...form.register('budget')} /></Field>
          </div>
          <Field label="What should we talk about?" error={form.formState.errors.goals?.message}>
            <textarea className={`${inputClass} min-h-28`} {...form.register('goals')} />
          </Field>
          <Field label="Format" error={form.formState.errors.format?.message}>
            <select className={inputClass} {...form.register('format')}>
              <option value="video">Video call</option>
              <option value="phone">Phone</option>
              <option value="office">Office</option>
            </select>
          </Field>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" {...form.register('consent')} />
            I agree to be contacted about this request.
          </label>
          {form.formState.errors.consent ? <p className="text-sm text-red-700" role="alert">{form.formState.errors.consent.message}</p> : null}
          <input className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" {...form.register('hp_field')} />
          <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Sending…' : 'Request time'}</Button>
        </div>
        <aside className="h-fit rounded-3xl bg-navy-900 p-6 text-white">
          <h2 className="text-lg font-semibold">Your request</h2>
          <p className="mt-3 text-sm text-white/70">Status after you submit: pending. A staff member confirms or declines it from the admin bookings page.</p>
        </aside>
      </form>
    </>
  )
}
