export function formatPrice(course) {
  if (course?.price_label) {
    return course.price_label
  }

  if (course?.price === null || course?.price === undefined || course?.price === '') {
    return 'Contact for price'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(course.price))
}

export function toIsoDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function formatDate(value) {
  if (!value) {
    return '—'
  }

  const text = String(value)
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(text)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function weekdaySlots(monthDate) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const first = new Date(year, month, 1)
  const start = new Date(first)
  start.setDate(1 - ((first.getDay() + 6) % 7))
  const days = []

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    days.push(date)
  }

  return days
}

export const BOOKING_TIMES = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
]
