export function djb2Hash(input: string): number {
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0
  }
  return hash >>> 0
}

export function computeFingerprint(
  fileNames: string[],
  fileContents: { name: string; data: Uint8Array }[],
): string {
  const nameHash = djb2Hash(
    [...fileNames].sort().join('\n'),
  )

  let contentHash = 0
  for (const file of fileContents) {
    const decoder = new TextDecoder('utf-8', { fatal: false })
    const text = decoder.decode(file.data)
    contentHash = ((contentHash << 5) - contentHash + djb2Hash(text)) | 0
  }

  return `${nameHash.toString(36)}-${(contentHash >>> 0).toString(36)}`
}
