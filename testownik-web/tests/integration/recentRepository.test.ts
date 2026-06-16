import { describe, it, expect, beforeEach } from 'vitest'
import {
  upsertRecent,
  listRecents,
  deleteRecent,
} from '@/platform/persistence/recentRepository'
import { closeDB } from '@/platform/persistence/db'

beforeEach(async () => {
  closeDB()
  await new Promise((resolve) => {
    const req = indexedDB.deleteDatabase('testownik-db')
    req.onsuccess = () => resolve(undefined)
  })
})

describe('recentRepository', () => {
  it('upserts and lists recents ordered by last opened', async () => {
    await upsertRecent('q1')
    await new Promise((r) => setTimeout(r, 10))
    await upsertRecent('q2')
    await new Promise((r) => setTimeout(r, 10))
    await upsertRecent('q3')

    const recents = await listRecents()
    expect(recents).toHaveLength(3)
    expect(recents[0]!.quizId).toBe('q3')
    expect(recents[1]!.quizId).toBe('q2')
    expect(recents[2]!.quizId).toBe('q1')
  })

  it('updates existing recent entry', async () => {
    await upsertRecent('q1')
    await new Promise((r) => setTimeout(r, 10))
    await upsertRecent('q1')

    const recents = await listRecents()
    expect(recents).toHaveLength(1)
    expect(recents[0]!.quizId).toBe('q1')
  })

  it('deletes a recent entry', async () => {
    await upsertRecent('q1')
    await upsertRecent('q2')
    await deleteRecent('q1')

    const recents = await listRecents()
    expect(recents).toHaveLength(1)
    expect(recents[0]!.quizId).toBe('q2')
  })

  it('returns empty list when no recents', async () => {
    const recents = await listRecents()
    expect(recents).toHaveLength(0)
  })
})
