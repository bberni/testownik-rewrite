import { describe, it, expect } from 'vitest'
import { APP_VERSION } from '@/app/version'

describe('app version', () => {
  it('is a string', () => {
    expect(typeof APP_VERSION).toBe('string')
  })
})
