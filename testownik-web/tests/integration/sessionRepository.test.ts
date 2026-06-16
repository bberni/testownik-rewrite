import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveSession,
  getSession,
  getLatestSession,
  listSessionsByQuiz,
  completeSession,
  deleteSession,
  deleteSessionsByQuiz,
} from '@/platform/persistence/sessionRepository'
import { closeDB } from '@/platform/persistence/db'
import type { QuizSession } from '@/domain/quizTypes'

function makeSession(overrides: Partial<QuizSession> = {}): QuizSession {
  return {
    schemaVersion: 1,
    id: 's1',
    quizId: 'q1',
    startedAt: 1000,
    updatedAt: 1000,
    completedAt: null,
    numberOfLearnedQuestions: 0,
    numberOfCorrectAnswers: 0,
    numberOfBadAnswers: 0,
    time: 0,
    reoccurrences: [],
    ...overrides,
  }
}

beforeEach(async () => {
  closeDB()
  await new Promise((resolve) => {
    const req = indexedDB.deleteDatabase('testownik-db')
    req.onsuccess = () => resolve(undefined)
  })
})

describe('sessionRepository', () => {
  it('saves and retrieves a session', async () => {
    const session = makeSession()
    await saveSession(session)
    const retrieved = await getSession('s1')
    expect(retrieved).not.toBeUndefined()
    expect(retrieved!.id).toBe('s1')
    expect(retrieved!.quizId).toBe('q1')
  })

  it('returns undefined for missing session', async () => {
    const result = await getSession('nonexistent')
    expect(result).toBeUndefined()
  })

  it('gets latest session by quiz', async () => {
    await saveSession(makeSession({ id: 'old', startedAt: 1000 }))
    await saveSession(makeSession({ id: 'new', startedAt: 2000 }))
    const latest = await getLatestSession('q1')
    expect(latest!.id).toBe('new')
  })

  it('lists sessions by quiz', async () => {
    await saveSession(makeSession({ id: 's1', quizId: 'q1' }))
    await saveSession(makeSession({ id: 's2', quizId: 'q1' }))
    await saveSession(makeSession({ id: 's3', quizId: 'q2' }))
    const sessions = await listSessionsByQuiz('q1')
    expect(sessions).toHaveLength(2)
  })

  it('completes a session', async () => {
    await saveSession(makeSession())
    const now = Date.now()
    await completeSession('s1', now)
    const completed = await getSession('s1')
    expect(completed!.completedAt).toBe(now)
  })

  it('deletes a single session', async () => {
    await saveSession(makeSession())
    await deleteSession('s1')
    const result = await getSession('s1')
    expect(result).toBeUndefined()
  })

  it('deletes all sessions for a quiz', async () => {
    await saveSession(makeSession({ id: 's1', quizId: 'q1' }))
    await saveSession(makeSession({ id: 's2', quizId: 'q1' }))
    await deleteSessionsByQuiz('q1')
    const list = await listSessionsByQuiz('q1')
    expect(list).toHaveLength(0)
  })
})
