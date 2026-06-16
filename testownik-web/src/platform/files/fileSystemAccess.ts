import type { VirtualFile, VirtualDirectory } from './importedFileTree'

export function isFileSystemAccessSupported(): boolean {
  return 'showDirectoryPicker' in globalThis
}

async function readDirectory(
  handle: FileSystemDirectoryHandle,
  parentPath: string,
): Promise<VirtualDirectory> {
  const files: VirtualFile[] = []
  const subdirectories: VirtualDirectory[] = []

  const dirPath = parentPath
    ? `${parentPath}/${handle.name}`
    : handle.name

  for await (const [name, entry] of handle as unknown as AsyncIterable<
    [string, FileSystemHandle]
  >) {
    if (entry.kind === 'file') {
      const fileHandle = entry as FileSystemFileHandle
      const file = await fileHandle.getFile()
      files.push({
        name,
        path: `${dirPath}/${name}`,
        size: file.size,
        lastModified: file.lastModified,
        getData: async () => {
          const buffer = await file.arrayBuffer()
          return new Uint8Array(buffer)
        },
      })
    } else if (entry.kind === 'directory') {
      const subHandle = entry as FileSystemDirectoryHandle
      const sub = await readDirectory(subHandle, dirPath)
      subdirectories.push(sub)
    }
  }

  return {
    name: handle.name,
    path: dirPath,
    files,
    subdirectories,
  }
}

export async function importViaFileSystemAccess(): Promise<VirtualDirectory | null> {
  if (!isFileSystemAccessSupported()) {
    return null
  }

  try {
    const handle = await (globalThis as { showDirectoryPicker?: (opts?: { mode: string }) => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker!({
      mode: 'read',
    })

    return await readDirectory(handle, '')
  } catch (err) {
    if (
      err instanceof DOMException &&
      err.name === 'AbortError'
    ) {
      return null
    }
    throw err
  }
}
