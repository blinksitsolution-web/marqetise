import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Brand from '../../components/Brand'
import { LegalNotice } from '../../components/LegalNotice'
import Seo from '../../components/Seo'
import { Button, Field, Notice, inputClass } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { forgotSchema, loginSchema, resetSchema } from '../../schemas/forms'
import { api, ensureCsrf, errorMessage } from '../../services/api'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const form = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '', remember: false } })

  async function onSubmit(values) {
    setMessage('')
    try {
      await login(values)
      navigate('/admin')
    } catch (error) {
      setMessage(errorMessage(error, 'Incorrect email or password.'))
    }
  }

  return (
    <AuthShell title="Sign in to admin" description="Staff access only">
      <Seo title="Admin sign in" path="/admin/login" robots="noindex,nofollow" />
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {message ? <Notice tone="error">{message}</Notice> : null}
        <Field label="Email" error={form.formState.errors.email?.message}>
          <input className={inputClass} type="email" autoComplete="username" {...form.register('email')} />
        </Field>
        <Field label="Password" error={form.formState.errors.password?.message}>
          <input className={inputClass} type="password" autoComplete="current-password" {...form.register('password')} />
        </Field>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" {...form.register('remember')} /> Remember me</label>
          <Link to="/admin/forgot-password" className="font-semibold text-blue">Forgot password?</Link>
        </div>
        <Button type="submit" variant="blue" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
        <p className="rounded-xl bg-surface px-3 py-2 text-xs text-muted">Authorised staff only. Credentials are verified by the server.</p>
        <LegalNotice>Staff sign-in stores a session. Read the</LegalNotice>
      </form>
    </AuthShell>
  )
}

export function ForgotPasswordPage() {
  const [message, setMessage] = useState('')
  const form = useForm({ resolver: zodResolver(forgotSchema), defaultValues: { email: '' } })

  async function onSubmit(values) {
    try {
      await ensureCsrf()
      const response = await api.post('/api/v1/auth/forgot-password', values)
      setMessage(response.data.message)
    } catch (error) {
      setMessage(errorMessage(error))
    }
  }

  return (
    <AuthShell title="Reset your password" description="We will not confirm whether the email exists.">
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {message ? <Notice>{message}</Notice> : null}
        <Field label="Email" error={form.formState.errors.email?.message}>
          <input className={inputClass} type="email" {...form.register('email')} />
        </Field>
        <Button type="submit" variant="blue" className="w-full">Send reset link</Button>
        <LegalNotice>Password reset stores the email address you enter. Read the</LegalNotice>
      </form>
    </AuthShell>
  )
}

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const form = useForm({ resolver: zodResolver(resetSchema), defaultValues: { password: '', password_confirmation: '' } })

  async function onSubmit(values) {
    try {
      await ensureCsrf()
      const response = await api.post('/api/v1/auth/reset-password', {
        ...values,
        token: params.get('token'),
        email: params.get('email'),
      })
      setMessage(response.data.message)
      setTimeout(() => navigate('/admin/login'), 800)
    } catch (error) {
      setMessage(errorMessage(error))
    }
  }

  return (
    <AuthShell title="Choose a new password" description="Use at least 12 characters, with mixed case, a number, and a symbol.">
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {message ? <Notice>{message}</Notice> : null}
        <Field label="New password" error={form.formState.errors.password?.message}>
          <input className={inputClass} type="password" {...form.register('password')} />
        </Field>
        <Field label="Confirm password" error={form.formState.errors.password_confirmation?.message}>
          <input className={inputClass} type="password" {...form.register('password_confirmation')} />
        </Field>
        <Button type="submit" variant="blue" className="w-full">Update password</Button>
        <LegalNotice>This form sets a new password for the staff account. Read the</LegalNotice>
      </form>
    </AuthShell>
  )
}

function AuthShell({ title, description, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <Brand light />
        <h1 className="mt-6 text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted">{description}</p>
        <div className="mt-6">{children}</div>
        <a href="/" className="mt-6 block text-center text-sm text-muted">Back to website</a>
      </div>
    </div>
  )
}
