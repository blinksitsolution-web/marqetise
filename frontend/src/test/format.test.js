import { describe, expect, it } from 'vitest'
import { formatDate } from '../utils/format'

describe('formatDate', () => {
  it('keeps a date-only value on that calendar day', () => {
    expect(formatDate('2026-06-15')).toBe('15 Jun 2026')
    expect(formatDate('')).toBe('—')
  })
})
