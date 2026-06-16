import { describe, it, expect } from 'vitest'
import { formatDuration } from '@/domain/saveJsonCompat'

describe('formatDuration', () => {
  it('formats zero as 00:00:00', () => {
    expect(formatDuration(0)).toBe('00:00:00')
  })

  it('formats seconds only', () => {
    expect(formatDuration(5000)).toBe('00:00:05')
  })

  it('formats minutes and seconds', () => {
    expect(formatDuration(65000)).toBe('00:01:05')
  })

  it('formats hours, minutes, and seconds', () => {
    expect(formatDuration(3723000)).toBe('01:02:03')
  })

  it('formats large hour values', () => {
    expect(formatDuration(7380000)).toBe('02:03:00')
  })

  it('pads single digits with zero', () => {
    expect(formatDuration(1000)).toBe('00:00:01')
    expect(formatDuration(60000)).toBe('00:01:00')
    expect(formatDuration(3600000)).toBe('01:00:00')
  })

  it('matches legacy moment.duration HH:mm:ss format', () => {
    // 1 hour, 23 minutes, 45 seconds
    const ms = (1 * 3600 + 23 * 60 + 45) * 1000
    expect(formatDuration(ms)).toBe('01:23:45')
  })

  it('handles fractional milliseconds (truncates)', () => {
    expect(formatDuration(3723456)).toBe('01:02:03')
  })
})
