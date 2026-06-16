import { describe, it, expect } from 'vitest'
import { djb2Hash, computeFingerprint } from '@/domain/fingerprint'

describe('djb2Hash', () => {
  it('returns consistent hash for same input', () => {
    expect(djb2Hash('hello')).toBe(djb2Hash('hello'))
  })

  it('returns different hash for different inputs', () => {
    expect(djb2Hash('hello')).not.toBe(djb2Hash('world'))
  })

  it('returns different hash when input order changes', () => {
    const a = djb2Hash('a\nb')
    const b = djb2Hash('b\na')
    expect(a).not.toBe(b)
  })

  it('handles empty string', () => {
    expect(djb2Hash('')).toBe(5381)
  })
})

describe('computeFingerprint', () => {
  it('produces consistent fingerprint for same files', () => {
    const names = ['001.txt', '002.txt']
    const contents = [
      { name: '001.txt', data: new TextEncoder().encode('X10\nQ1?\nYes\nNo') },
      { name: '002.txt', data: new TextEncoder().encode('X01\nQ2?\nA\nB') },
    ]

    const fp1 = computeFingerprint(names, contents)
    const fp2 = computeFingerprint(names, contents)
    expect(fp1).toBe(fp2)
  })

  it('produces different fingerprint for different content', () => {
    const names = ['001.txt']
    const c1 = [
      { name: '001.txt', data: new TextEncoder().encode('X10\nQ1?\nYes\nNo') },
    ]
    const c2 = [
      { name: '001.txt', data: new TextEncoder().encode('X01\nDifferent\nA\nB') },
    ]

    const fp1 = computeFingerprint(names, c1)
    const fp2 = computeFingerprint(names, c2)
    expect(fp1).not.toBe(fp2)
  })

  it('produces different fingerprint for different file names', () => {
    const names1 = ['a.txt']
    const names2 = ['b.txt']
    const contents = [
      { name: 'a.txt', data: new TextEncoder().encode('X10\nQ?\nYes\nNo') },
    ]

    const fp1 = computeFingerprint(names1, contents)
    const fp2 = computeFingerprint(
      names2,
      contents,
    )
    expect(fp1).not.toBe(fp2)
  })

  it('handles empty file list', () => {
    const fp = computeFingerprint([], [])
    expect(typeof fp).toBe('string')
    expect(fp.length).toBeGreaterThan(0)
  })
})
