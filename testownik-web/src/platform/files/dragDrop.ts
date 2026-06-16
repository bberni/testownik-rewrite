import type { VirtualDirectory } from './importedFileTree'

export function isDirectoryDragSupported(): boolean {
  return 'DataTransferItem' in globalThis
}

async function readEntry(
  entry: FileSystemEntry,
  parentPath: string,
): Promise<VirtualDirectory> {
  const files: VirtualDirectory['files'] = []
  const subdirectories: VirtualDirectory['subdirectories'] = []

  const dirPath = parentPath
    ? `${parentPath}/${entry.name}`
    : entry.name

  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader()

    const readAllEntries = (): Promise<FileSystemEntry[]> => {
      return new Promise((resolve) => {
        const allEntries: FileSystemEntry[] = []
        const readBatch = () => {
          reader.readEntries((entries) => {
            if (entries.length === 0) {
              resolve(allEntries)
            } else {
              allEntries.push(...entries)
              readBatch()
            }
          })
        }
        readBatch()
      })
    }

    const entries = await readAllEntries()
    for (const child of entries) {
      if (child.isFile) {
        const fileEntry = child as FileSystemFileEntry
        const file = await new Promise<File>((resolve) => {
          fileEntry.file(resolve)
        })
        files.push({
          name: child.name,
          path: `${dirPath}/${child.name}`,
          size: file.size,
          lastModified: file.lastModified,
          getData: async () => {
            const buffer = await file.arrayBuffer()
            return new Uint8Array(buffer)
          },
        })
      } else if (child.isDirectory) {
        const sub = await readEntry(child, dirPath)
        subdirectories.push(sub)
      }
    }
  }

  return {
    name: entry.name,
    path: dirPath,
    files,
    subdirectories,
  }
}

export async function handleDrop(
  event: DragEvent,
): Promise<VirtualDirectory | null> {
  const items = event.dataTransfer?.items
  if (!items) return null

  const entries: FileSystemEntry[] = []
  for (const item of Array.from(items)) {
    const entry =
      'getAsEntry' in item
        ? (item as DataTransferItem).webkitGetAsEntry?.()
        : null
    if (entry) {
      entries.push(entry)
    }
  }

  if (entries.length === 0) return null

  const rootEntry = entries[0]!
  const rootPath = ''

  return await readEntry(rootEntry, rootPath)
}
