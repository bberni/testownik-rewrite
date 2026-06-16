export interface VirtualFile {
  name: string
  path: string // relative, forward-slash-normalized
  size: number
  lastModified?: number
  getData(): Promise<Uint8Array>
}

export interface VirtualDirectory {
  name: string
  path: string
  files: VirtualFile[]
  subdirectories: VirtualDirectory[]
}

export function findFile(
  dir: VirtualDirectory,
  relativePath: string,
): VirtualFile | undefined {
  const parts = relativePath.split('/')
  let current: VirtualDirectory | undefined = dir

  for (let i = 0; i < parts.length - 1; i++) {
    current = current.subdirectories.find(
      (d) => d.name === parts[i],
    )
    if (!current) return undefined
  }

  const fileName = parts[parts.length - 1]!
  return current.files.find((f) => f.name === fileName)
}

export function listAllFiles(dir: VirtualDirectory): VirtualFile[] {
  const result: VirtualFile[] = [...dir.files]
  for (const sub of dir.subdirectories) {
    result.push(...listAllFiles(sub))
  }
  return result
}

export function listFilesByExtension(
  dir: VirtualDirectory,
  ext: string,
): VirtualFile[] {
  return listAllFiles(dir).filter((f) =>
    f.name.endsWith(ext),
  )
}
