import { describe, it, expect } from 'vitest'
import { isUtf8, decodeBuffer } from '@/domain/encoding'

function toBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

function fromHex(hex: string): Uint8Array {
  const bytes: number[] = []
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substring(i, i + 2), 16))
  }
  return new Uint8Array(bytes)
}

describe('isUtf8', () => {
  it('detects valid UTF-8 ASCII', () => {
    expect(isUtf8(toBytes('Hello'))).toBe(true)
  })

  it('detects valid UTF-8 with Polish characters', () => {
    expect(isUtf8(toBytes('Zażółć gęślą jaźń'))).toBe(true)
  })

  it('detects empty buffer as valid', () => {
    expect(isUtf8(new Uint8Array(0))).toBe(true)
  })

  it('rejects invalid UTF-8 byte sequences (0xC2 0x28)', () => {
    expect(isUtf8(new Uint8Array([0xc2, 0x28]))).toBe(false)
  })

  it('rejects overlong sequences (0xC0 0xAF)', () => {
    expect(isUtf8(new Uint8Array([0xc0, 0xaf]))).toBe(false)
  })

  it('rejects continuation byte without lead byte', () => {
    expect(isUtf8(new Uint8Array([0x80]))).toBe(false)
  })

  it('accepts valid 3-byte sequence (euro sign)', () => {
    expect(isUtf8(toBytes('€'))).toBe(true)
  })

  it('works with plain number arrays', () => {
    expect(isUtf8([0x48, 0x65, 0x6c, 0x6c, 0x6f])).toBe(true)
  })

  it('rejects null continuation byte in 2-byte sequence', () => {
    expect(isUtf8(new Uint8Array([0xc3, 0x00]))).toBe(false)
  })
})

describe('decodeBuffer', () => {
  it('decodes valid UTF-8 text', () => {
    const text = 'Hello, World!'
    expect(decodeBuffer(toBytes(text))).toBe(text)
  })

  it('decodes UTF-8 Polish text', () => {
    const text = 'Zażółć gęślą jaźń'
    expect(decodeBuffer(toBytes(text))).toBe(text)
  })

  it('decodes Windows-1250 Polish text', () => {
    const bytes = fromHex(
      '5a61bff3b3e62067ea9c6cb9206a619ff1',
    )
    expect(decodeBuffer(bytes)).toBe('Zażółć gęślą jaźń')
  })

  it('decodes Windows-1250 text with special chars', () => {
    const bytes = new Uint8Array([0x8c, 0x9c, 0x8f, 0x9f])
    expect(decodeBuffer(bytes)).toBe('ŚśŹź')
  })
})
