import { describe, expect, it } from 'vitest'
import { GHANA_PHONE_ERROR, ghanaDisplay, ghanaE164, ghanaNational } from '../components/ghanaPhone'

describe('Ghana phone numbers', () => {
  it('accepts local, international, and spaced numbers', () => {
    expect(ghanaNational('059 353 5225')).toBe('593535225')
    expect(ghanaE164('059-353-5225')).toBe('+233593535225')
    expect(ghanaDisplay('+233593535225')).toBe('+233 59 353 5225')
    expect(ghanaE164('233593535225')).toBe('+233593535225')
    expect(ghanaDisplay('0241234567')).toBe('+233 24 123 4567')
    expect(ghanaE164('(030) 123-4567')).toBe('+233301234567')
    expect(ghanaDisplay('+233.24.123.4567')).toBe('+233 24 123 4567')
  })

  it('rejects other countries, bad prefixes, and short numbers', () => {
    for (const value of ['+12025550123', '0211234567', '024123456', '241234567', '00233593535225', 'abc']) {
      expect(ghanaE164(value), value).toBe('')
    }
    expect(ghanaDisplay('call me')).toBe('call me')
    expect(ghanaE164('')).toBe('')
    expect(GHANA_PHONE_ERROR).toContain('024 123 4567')
  })
})
