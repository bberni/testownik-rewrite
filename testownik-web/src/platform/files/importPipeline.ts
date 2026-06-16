import {
  decodeBuffer,
} from '@/domain/encoding'
import { parseQuestionFile } from '@/domain/parseQuestionFile'
import { computeFingerprint } from '@/domain/fingerprint'
import { deserializeSaveJson } from '@/domain/saveJsonCompat'
import type {
  Question,
  CompatibleSaveJson,
} from '@/domain/quizTypes'
import type { VirtualDirectory } from './importedFileTree'
import { listAllFiles } from './importedFileTree'

export interface ImportResult {
  name: string
  questions: Question[]
  assets: ImportedAsset[]
  fingerprint: string
  saveJson: CompatibleSaveJson | null
}

export interface ImportedAsset {
  relativePath: string
  blob: Blob
  mimeType: string
  size: number
}

interface ParsedFile {
  filename: string
  text: string
}

function guessMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
    webp: 'image/webp',
  }
  return mimeMap[ext] ?? 'application/octet-stream'
}

function collectImageRefs(questions: Question[]): Set<string> {
  const refs = new Set<string>()

  for (const q of questions) {
    if (q.contentType === 'image' && typeof q.content === 'string') {
      refs.add(q.content)
    }

    if (q.type === 'single') {
      const answers = q.answers as {
        type: string
        content: string
      }[]
      for (const a of answers) {
        if (a.type === 'image') {
          refs.add(a.content)
        }
      }
    } else if (q.type === 'select') {
      const answers = q.answers as {
        options: { type: string; content: string }[]
      }[]
      for (const a of answers) {
        for (const o of a.options) {
          if (o.type === 'image') {
            refs.add(o.content)
          }
        }
      }
    }
  }

  return refs
}

export async function runImportPipeline(
  dir: VirtualDirectory,
): Promise<ImportResult> {
  const allFiles = listAllFiles(dir)

  const txtFiles = allFiles.filter((f) => f.name.endsWith('.txt'))
  const parsedFiles: ParsedFile[] = []

  for (const file of txtFiles) {
    const data = await file.getData()
    const text = decodeBuffer(data)
    parsedFiles.push({ filename: file.name, text })
  }

  const questions = parsedFiles
    .map((f) => parseQuestionFile(f.filename, f.text))
    .filter((q): q is Question => q !== null)

  const imageRefs = collectImageRefs(questions)
  const assets: ImportedAsset[] = []

  for (const ref of imageRefs) {
    const file = allFiles.find(
      (f) => f.path.endsWith(`/${ref}`),
    )
    if (file) {
      const data = await file.getData()
      assets.push({
        relativePath: ref,
        blob: new Blob([data], {
          type: guessMimeType(ref),
        }),
        mimeType: guessMimeType(ref),
        size: data.byteLength,
      })
    }
  }

  const txtFileContents = await Promise.all(
    txtFiles.map(async (f) => ({
      name: f.name,
      data: await f.getData(),
    })),
  )

  const fingerprint = computeFingerprint(
    txtFiles.map((f) => f.name),
    txtFileContents,
  )

  let saveJson: CompatibleSaveJson | null = null
  const saveFile = allFiles.find((f) => f.name === 'save.json')
  if (saveFile) {
    try {
      const data = await saveFile.getData()
      const text = new TextDecoder('utf-8').decode(data)
      saveJson = deserializeSaveJson(text)
    } catch {
      saveJson = null
    }
  }

  return {
    name: dir.name,
    questions,
    assets,
    fingerprint,
    saveJson,
  }
}
