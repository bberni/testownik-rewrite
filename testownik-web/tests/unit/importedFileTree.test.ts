import { describe, it, expect } from 'vitest'
import type { VirtualDirectory } from '@/platform/files/importedFileTree'
import {
  findFile,
  listAllFiles,
  listFilesByExtension,
} from '@/platform/files/importedFileTree'

function makeTree(): VirtualDirectory {
  return {
    name: 'root',
    path: 'root',
    files: [
      {
        name: '001.txt',
        path: 'root/001.txt',
        size: 100,
        getData: () => Promise.resolve(new Uint8Array()),
      },
      {
        name: 'save.json',
        path: 'root/save.json',
        size: 50,
        getData: () => Promise.resolve(new Uint8Array()),
      },
      {
        name: 'photo.jpg',
        path: 'root/photo.jpg',
        size: 200,
        getData: () => Promise.resolve(new Uint8Array()),
      },
    ],
    subdirectories: [
      {
        name: 'images',
        path: 'root/images',
        files: [
          {
            name: 'diagram.png',
            path: 'root/images/diagram.png',
            size: 300,
            getData: () => Promise.resolve(new Uint8Array()),
          },
        ],
        subdirectories: [],
      },
    ],
  }
}

describe('importedFileTree', () => {
  describe('findFile', () => {
    it('finds file at root level', () => {
      const tree = makeTree()
      const file = findFile(tree, '001.txt')
      expect(file).not.toBeUndefined()
      expect(file!.name).toBe('001.txt')
    })

    it('finds file in subdirectory', () => {
      const tree = makeTree()
      const file = findFile(tree, 'images/diagram.png')
      expect(file).not.toBeUndefined()
      expect(file!.name).toBe('diagram.png')
    })

    it('returns undefined for missing file', () => {
      const tree = makeTree()
      expect(findFile(tree, 'nonexistent.txt')).toBeUndefined()
    })
  })

  describe('listAllFiles', () => {
    it('lists all files recursively', () => {
      const tree = makeTree()
      const all = listAllFiles(tree)
      expect(all).toHaveLength(4)
    })
  })

  describe('listFilesByExtension', () => {
    it('filters by extension', () => {
      const tree = makeTree()
      const txt = listFilesByExtension(tree, '.txt')
      expect(txt).toHaveLength(1)
      expect(txt[0]!.name).toBe('001.txt')
    })

    it('returns empty for no matches', () => {
      const tree = makeTree()
      expect(listFilesByExtension(tree, '.pdf')).toHaveLength(0)
    })
  })
})
