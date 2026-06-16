import type { VirtualFile, VirtualDirectory } from './importedFileTree'

export function createFileInputForDirectory(): HTMLInputElement {
  const input = document.createElement('input')
  input.type = 'file'
  input.setAttribute('webkitdirectory', '')
  input.setAttribute('directory', '')
  input.multiple = true
  return input
}

export function importViaFileInput(
  input: HTMLInputElement,
): Promise<VirtualDirectory | null> {
  return new Promise((resolve) => {
    input.addEventListener(
      'change',
      () => {
        const fileList = input.files
        if (!fileList || fileList.length === 0) {
          resolve(null)
          return
        }

        const dir = buildTreeFromFileList(fileList)
        resolve(dir)
      },
      { once: true },
    )

    input.addEventListener(
      'cancel',
      () => {
        resolve(null)
      },
      { once: true },
    )

    input.click()
  })
}

export function buildTreeFromFileList(
  fileList: FileList,
): VirtualDirectory | null {
  if (fileList.length === 0) return null

  const firstPath = (
    fileList[0]!.webkitRelativePath || fileList[0]!.name
  ).replace(/\\/g, '/')
  const rootName = firstPath.split('/')[0]!

  const root: VirtualDirectory = {
    name: rootName,
    path: rootName,
    files: [],
    subdirectories: [],
  }

  const dirMap = new Map<string, VirtualDirectory>()
  dirMap.set(rootName, root)

  for (const file of fileList) {
    const relativePath = (
      file.webkitRelativePath || file.name
    ).replace(/\\/g, '/')
    const parts = relativePath.split('/')

    for (let j = 0; j < parts.length - 1; j++) {
      const dirPath = parts.slice(0, j + 1).join('/')
      if (!dirMap.has(dirPath)) {
        const newDir: VirtualDirectory = {
          name: parts[j]!,
          path: dirPath,
          files: [],
          subdirectories: [],
        }
        const parentPath = parts.slice(0, j).join('/') || rootName
        const parent = dirMap.get(parentPath)
        if (parent) {
          parent.subdirectories.push(newDir)
          dirMap.set(dirPath, newDir)
        }
      }
    }

    const parentPath =
      parts.slice(0, -1).join('/') || rootName
    const parent = dirMap.get(parentPath)
    if (!parent) continue

    const vf: VirtualFile = {
      name: parts[parts.length - 1]!,
      path: relativePath,
      size: file.size,
      lastModified: file.lastModified,
      getData: async () => {
        const buffer = await file.arrayBuffer()
        return new Uint8Array(buffer)
      },
    }
    parent.files.push(vf)
  }

  return root
}
