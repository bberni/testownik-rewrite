import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveAsset,
  getAsset,
  getAssetsByQuiz,
  deleteAssetsByQuiz,
} from '@/platform/assets/assetRepository'
import { closeDB } from '@/platform/persistence/db'

beforeEach(async () => {
  closeDB()
  await new Promise((resolve) => {
    const req = indexedDB.deleteDatabase('testownik-db')
    req.onsuccess = () => resolve(undefined)
  })
})

describe('assetRepository', () => {
  it('saves and retrieves an asset', async () => {
    await saveAsset({
      quizId: 'q1',
      relativePath: 'images/photo.jpg',
      blob: new Blob(['test'], { type: 'image/jpeg' }),
      mimeType: 'image/jpeg',
      size: 4,
    })

    const asset = await getAsset('q1', 'images/photo.jpg')
    expect(asset).not.toBeUndefined()
    expect(asset!.mimeType).toBe('image/jpeg')
    expect(asset!.relativePath).toBe('images/photo.jpg')
  })

  it('returns undefined for missing asset', async () => {
    const asset = await getAsset('q1', 'nonexistent.jpg')
    expect(asset).toBeUndefined()
  })

  it('handles multiple assets for same quiz', async () => {
    await saveAsset({
      quizId: 'q1',
      relativePath: 'a.jpg',
      blob: new Blob(['a']),
      mimeType: 'image/jpeg',
      size: 1,
    })
    await saveAsset({
      quizId: 'q1',
      relativePath: 'b.jpg',
      blob: new Blob(['bb']),
      mimeType: 'image/jpeg',
      size: 2,
    })

    const assets = await getAssetsByQuiz('q1')
    expect(assets).toHaveLength(2)
  })

  it('deletes all assets for a quiz', async () => {
    await saveAsset({
      quizId: 'q1',
      relativePath: 'a.jpg',
      blob: new Blob(['a']),
      mimeType: 'image/jpeg',
      size: 1,
    })
    await deleteAssetsByQuiz('q1')
    const assets = await getAssetsByQuiz('q1')
    expect(assets).toHaveLength(0)
  })

  it('gets empty array for quiz with no assets', async () => {
    const assets = await getAssetsByQuiz('nonexistent-quiz')
    expect(assets).toHaveLength(0)
  })
})
