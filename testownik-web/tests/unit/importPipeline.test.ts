import { describe, it, expect } from 'vitest'
import { runImportPipeline } from '@/platform/files/importPipeline'
import type { VirtualDirectory, VirtualFile } from '@/platform/files/importedFileTree'

function makeFile(
  name: string,
  content: string | Uint8Array,
  dirPath = 'quiz',
): VirtualFile {
  const data =
    typeof content === 'string'
      ? new TextEncoder().encode(content)
      : content
  return {
    name,
    path: `${dirPath}/${name}`,
    size: data.byteLength,
    getData: () => Promise.resolve(data),
  }
}

function makeTree(files: VirtualFile[]): VirtualDirectory {
  return {
    name: 'quiz',
    path: 'quiz',
    files,
    subdirectories: [],
  }
}

describe('importPipeline', () => {
  it('parses X question from .txt file', async () => {
    const tree = makeTree([
      makeFile('001.txt', 'X10\nWhat is 2+2?\n3\n4'),
    ])
    const result = await runImportPipeline(tree)
    expect(result.questions).toHaveLength(1)
    expect(result.questions[0]!.type).toBe('single')
    expect(result.questions[0]!.content).toBe('What is 2+2?')
  })

  it('parses Y question from .txt file', async () => {
    const tree = makeTree([
      makeFile(
        '001.txt',
        'Y21\n{wybór 1} jest wybrany\nOpcja A;;Opcja B',
      ),
    ])
    const result = await runImportPipeline(tree)
    expect(result.questions).toHaveLength(1)
    expect(result.questions[0]!.type).toBe('select')
  })

  it('skips non-txt files', async () => {
    const tree = makeTree([makeFile('readme.md', '# Quiz')])
    const result = await runImportPipeline(tree)
    expect(result.questions).toHaveLength(0)
  })

  it('computes a fingerprint', async () => {
    const tree = makeTree([
      makeFile('001.txt', 'X10\nQ?\nA\nB'),
    ])
    const result = await runImportPipeline(tree)
    expect(result.fingerprint).toBeTruthy()
    expect(typeof result.fingerprint).toBe('string')
  })

  it('same files produce same fingerprint', async () => {
    const make = () =>
      makeTree([makeFile('001.txt', 'X10\nQ?\nA\nB')])
    const fp1 = (await runImportPipeline(make())).fingerprint
    const fp2 = (await runImportPipeline(make())).fingerprint
    expect(fp1).toBe(fp2)
  })

  it('detects save.json', async () => {
    const tree = makeTree([
      makeFile(
        'save.json',
        JSON.stringify({
          numberOfQuestions: 1,
          numberOfLearnedQuestions: 0,
          numberOfCorrectAnswers: 0,
          numberOfBadAnswers: 0,
          time: 0,
          reoccurrences: [{ tag: '001.txt', value: 2 }],
        }),
      ),
    ])
    const result = await runImportPipeline(tree)
    expect(result.saveJson).not.toBeNull()
    expect(result.saveJson!.numberOfQuestions).toBe(1)
  })

  it('handles invalid save.json gracefully', async () => {
    const tree = makeTree([makeFile('save.json', 'not json')])
    const result = await runImportPipeline(tree)
    expect(result.saveJson).toBeNull()
  })

  it('collects image assets referenced in questions', async () => {
    const tree = makeTree([
      makeFile('001.txt', 'X10\n[img]photo.jpg[/img]\nYes\nNo'),
      makeFile('photo.jpg', new Uint8Array([0xff, 0xd8, 0xff])),
    ])
    const result = await runImportPipeline(tree)
    expect(result.assets).toHaveLength(1)
    expect(result.assets[0]!.relativePath).toBe('photo.jpg')
    expect(result.assets[0]!.mimeType).toBe('image/jpeg')
  })

  it('handles missing image assets gracefully', async () => {
    const tree = makeTree([
      makeFile('001.txt', 'X10\n[img]missing.jpg[/img]\nYes\nNo'),
    ])
    const result = await runImportPipeline(tree)
    expect(result.assets).toHaveLength(0)
  })

  it('sets quiz name from directory name', async () => {
    const tree = makeTree([
      makeFile('001.txt', 'X10\nQ?\nA\nB'),
    ])
    const result = await runImportPipeline(tree)
    expect(result.name).toBe('quiz')
  })

  it('handles Windows-1250 encoded files', async () => {
    const data = new Uint8Array([
      0x58, 0x31, 0x30, 0x0a, 0x5a, 0x61, 0xbf, 0xf3, 0xb3, 0xe6, 0x20,
      0x67, 0xea, 0x9c, 0x6c, 0xb9, 0x0a, 0x54, 0x61, 0x6b, 0x0a, 0x4e,
      0x69, 0x65,
    ])
    const tree = makeTree([makeFile('001.txt', data)])
    const result = await runImportPipeline(tree)
    expect(result.questions).toHaveLength(1)
    expect(result.questions[0]!.content).toBe('Zażółć gęślą')
  })

  it('filters out invalid question files', async () => {
    const tree = makeTree([
      makeFile('001.txt', 'X10\nQ?\nA\nB'),
      makeFile('bad.txt', 'just one line\nand another'),
    ])
    const result = await runImportPipeline(tree)
    expect(result.questions).toHaveLength(1)
  })
})
