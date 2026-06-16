/**
 * Validates whether a byte array is valid UTF-8.
 * Ported from the legacy testownik-electron encodingDetector.js.
 */
export function isUtf8(data: Uint8Array | number[] | ArrayBuffer): boolean {
  let i = 0
  const len = data instanceof ArrayBuffer ? data.byteLength : data.length
  const bytes =
    data instanceof ArrayBuffer ? new Uint8Array(data) : data

  for (; i < len; i++) {
    const b = bytes[i]!

    if (b > 0xff) {
      return false
    }

    if (
      b === 0x09 ||
      b === 0x0a ||
      b === 0x0d ||
      (b >= 0x20 && b <= 0x7e)
    ) {
      continue
    }

    if (b >= 0xc2 && b <= 0xdf) {
      if (i + 1 >= len || bytes[i + 1]! < 0x80 || bytes[i + 1]! > 0xbf) {
        return false
      }
      i++
    } else if (b === 0xe0) {
      if (
        i + 2 >= len ||
        bytes[i + 1]! < 0xa0 ||
        bytes[i + 1]! > 0xbf ||
        bytes[i + 2]! < 0x80 ||
        bytes[i + 2]! > 0xbf
      ) {
        return false
      }
      i += 2
    } else if (
      (b >= 0xe1 && b <= 0xec) ||
      b === 0xee ||
      b === 0xef
    ) {
      if (
        i + 2 >= len ||
        bytes[i + 1]! < 0x80 ||
        bytes[i + 1]! > 0xbf ||
        bytes[i + 2]! < 0x80 ||
        bytes[i + 2]! > 0xbf
      ) {
        return false
      }
      i += 2
    } else if (b === 0xed) {
      if (
        i + 2 >= len ||
        bytes[i + 1]! < 0x80 ||
        bytes[i + 1]! > 0x9f ||
        bytes[i + 2]! < 0x80 ||
        bytes[i + 2]! > 0xbf
      ) {
        return false
      }
      i += 2
    } else if (b === 0xf0) {
      if (
        i + 3 >= len ||
        bytes[i + 1]! < 0x90 ||
        bytes[i + 1]! > 0xbf ||
        bytes[i + 2]! < 0x80 ||
        bytes[i + 2]! > 0xbf ||
        bytes[i + 3]! < 0x80 ||
        bytes[i + 3]! > 0xbf
      ) {
        return false
      }
      i += 3
    } else if (b >= 0xf1 && b <= 0xf3) {
      if (
        i + 3 >= len ||
        bytes[i + 1]! < 0x80 ||
        bytes[i + 1]! > 0xbf ||
        bytes[i + 2]! < 0x80 ||
        bytes[i + 2]! > 0xbf ||
        bytes[i + 3]! < 0x80 ||
        bytes[i + 3]! > 0xbf
      ) {
        return false
      }
      i += 3
    } else if (b === 0xf4) {
      if (
        i + 3 >= len ||
        bytes[i + 1]! < 0x80 ||
        bytes[i + 1]! > 0x8f ||
        bytes[i + 2]! < 0x80 ||
        bytes[i + 2]! > 0xbf ||
        bytes[i + 3]! < 0x80 ||
        bytes[i + 3]! > 0xbf
      ) {
        return false
      }
      i += 3
    } else {
      return false
    }
  }

  return true
}

/**
 * Complete Windows-1250 code page mapping (code point → Unicode character).
 * Matches the behavior of the `windows-1250` npm package used by the legacy app.
 */
const WINDOWS_1250_MAP: Record<number, string> = {
  0x80: '\u20AC',
  0x81: '\u0081',
  0x82: '\u201A',
  0x83: '\u0083',
  0x84: '\u201E',
  0x85: '\u2026',
  0x86: '\u2020',
  0x87: '\u2021',
  0x88: '\u0088',
  0x89: '\u2030',
  0x8a: '\u0160',
  0x8b: '\u2039',
  0x8c: '\u015A',
  0x8d: '\u0164',
  0x8e: '\u017D',
  0x8f: '\u0179',
  0x90: '\u0090',
  0x91: '\u2018',
  0x92: '\u2019',
  0x93: '\u201C',
  0x94: '\u201D',
  0x95: '\u2022',
  0x96: '\u2013',
  0x97: '\u2014',
  0x98: '\u0098',
  0x99: '\u2122',
  0x9a: '\u0161',
  0x9b: '\u203A',
  0x9c: '\u015B',
  0x9d: '\u0165',
  0x9e: '\u017E',
  0x9f: '\u017A',
  0xa0: '\u00A0',
  0xa1: '\u02C7',
  0xa2: '\u02D8',
  0xa3: '\u0141',
  0xa4: '\u00A4',
  0xa5: '\u0104',
  0xa6: '\u00A6',
  0xa7: '\u00A7',
  0xa8: '\u00A8',
  0xa9: '\u00A9',
  0xaa: '\u015E',
  0xab: '\u00AB',
  0xac: '\u00AC',
  0xad: '\u00AD',
  0xae: '\u00AE',
  0xaf: '\u017B',
  0xb0: '\u00B0',
  0xb1: '\u00B1',
  0xb2: '\u02DB',
  0xb3: '\u0142',
  0xb4: '\u00B4',
  0xb5: '\u00B5',
  0xb6: '\u00B6',
  0xb7: '\u00B7',
  0xb8: '\u00B8',
  0xb9: '\u0105',
  0xba: '\u015F',
  0xbb: '\u00BB',
  0xbc: '\u013D',
  0xbd: '\u02DD',
  0xbe: '\u013E',
  0xbf: '\u017C',
  0xc0: '\u0154',
  0xc1: '\u00C1',
  0xc2: '\u00C2',
  0xc3: '\u0102',
  0xc4: '\u00C4',
  0xc5: '\u0139',
  0xc6: '\u0106',
  0xc7: '\u00C7',
  0xc8: '\u010C',
  0xc9: '\u00C9',
  0xca: '\u0118',
  0xcb: '\u00CB',
  0xcc: '\u011A',
  0xcd: '\u00CD',
  0xce: '\u00CE',
  0xcf: '\u010E',
  0xd0: '\u0110',
  0xd1: '\u0143',
  0xd2: '\u0147',
  0xd3: '\u00D3',
  0xd4: '\u00D4',
  0xd5: '\u0150',
  0xd6: '\u00D6',
  0xd7: '\u00D7',
  0xd8: '\u0158',
  0xd9: '\u016E',
  0xda: '\u00DA',
  0xdb: '\u0170',
  0xdc: '\u00DC',
  0xdd: '\u00DD',
  0xde: '\u0162',
  0xdf: '\u00DF',
  0xe0: '\u0155',
  0xe1: '\u00E1',
  0xe2: '\u00E2',
  0xe3: '\u0103',
  0xe4: '\u00E4',
  0xe5: '\u013A',
  0xe6: '\u0107',
  0xe7: '\u00E7',
  0xe8: '\u010D',
  0xe9: '\u00E9',
  0xea: '\u0119',
  0xeb: '\u00EB',
  0xec: '\u011B',
  0xed: '\u00ED',
  0xee: '\u00EE',
  0xef: '\u010F',
  0xf0: '\u0111',
  0xf1: '\u0144',
  0xf2: '\u0148',
  0xf3: '\u00F3',
  0xf4: '\u00F4',
  0xf5: '\u0151',
  0xf6: '\u00F6',
  0xf7: '\u00F7',
  0xf8: '\u0159',
  0xf9: '\u016F',
  0xfa: '\u00FA',
  0xfb: '\u0171',
  0xfc: '\u00FC',
  0xfd: '\u00FD',
  0xfe: '\u0163',
  0xff: '\u02D9',
}

/**
 * Decodes a byte array as Windows-1250 text.
 * Matches the behavior of the `windows-1250` npm package decode() function.
 */
function decodeWindows1250(bytes: Uint8Array | number[]): string {
  let result = ''
  const arr = bytes instanceof Uint8Array ? Array.from(bytes) : bytes
  for (const byte of arr) {
    if (byte <= 0x7f) {
      result += String.fromCharCode(byte)
    } else {
      result += WINDOWS_1250_MAP[byte] ?? String.fromCharCode(byte)
    }
  }
  return result
}

/**
 * Decodes a byte buffer to text using UTF-8 if valid, otherwise Windows-1250.
 * This is the main decoding entry point, matching legacy behavior.
 */
export function decodeBuffer(buffer: Uint8Array | number[]): string {
  if (isUtf8(buffer)) {
    return new TextDecoder('utf-8').decode(
      buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer),
    )
  }
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  return decodeWindows1250(bytes)
}
