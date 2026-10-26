import { z } from 'zod'
import { GHANA_PHONE_ERROR, ghanaE164 } from '../components/ghanaPhone'

const phone = z.string().trim().refine(
  (value) => value === '' || Boolean(ghanaE164(value)),
  GHANA_PHONE_ERROR,
)

export const enquiryTypes = [
  ['marketing_services', 'Marketing services'],
  ['website_development', 'Website development'],
  ['course', 'Course'],
  ['corporate_training', 'Corporate training'],
  ['other', 'Other'],
]

export const inquirySchema = z.object({
  type: z.enum(['marketing_services', 'website_development', 'course', 'corporate_training', 'other']),
  name: z.string().trim().min(2, 'Enter your name').max(120),
  email: z.email('Enter a valid email'),
  phone,
  subject: z.string().trim().min(2, 'Enter a subject').max(160),
  message: z.string().trim().min(20, 'Please enter a short message, at least 20 characters').max(5000),
  course: z.string().optional(),
  consent: z.boolean().refine((value) => value, 'Please confirm that we may contact you'),
  hp_field: z.string().optional(),
}).superRefine((value, context) => {
  if (value.type === 'course' && !value.course) {
    context.addIssue({ code: 'custom', path: ['course'], message: 'Choose a course' })
  }
})

export const bookingSchema = z.object({
  service_id: z.string().min(1, 'Choose a service'),
  name: z.string().trim().min(2, 'Enter your name').max(120),
  email: z.email('Enter a valid email'),
  phone,
  company: z.string().trim().max(160).optional(),
  website: z.string().trim().refine(
    (value) => value === '' || value === undefined || /^https?:\/\/.+/i.test(value),
    'Enter a full website address, including https://',
  ).optional(),
  budget: z.string().trim().max(80).optional(),
  goals: z.string().trim().min(20, 'Tell us a little more about the goal').max(5000),
  format: z.enum(['video', 'phone', 'office']),
  preferred_date: z.string().min(1, 'Choose a date'),
  preferred_time: z.string().min(1, 'Choose a time'),
  consent: z.boolean().refine((value) => value, 'Please confirm that we may contact you'),
  hp_field: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
  remember: z.boolean().optional(),
})

export const forgotSchema = z.object({
  email: z.email('Enter a valid email'),
})

export const resetSchema = z.object({
  password: z.string().min(12, 'Use at least 12 characters').regex(/[a-z]/, 'Include a lowercase letter').regex(/[A-Z]/, 'Include an uppercase letter').regex(/[0-9]/, 'Include a number').regex(/[^A-Za-z0-9]/, 'Include a symbol'),
  password_confirmation: z.string(),
}).refine((value) => value.password === value.password_confirmation, {
  path: ['password_confirmation'],
  message: 'Passwords do not match',
})
