import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveQuiz,
  getQuiz,
  getQuizByFingerprint,
  listQuizzes,
  deleteQuiz,
  quizExists,
  updateQuiz,
} from '@/platform/persistence/quizRepository'
import { saveAsset, getAssetsByQuiz } from '@/platform/assets/assetRepository'
import {
  saveSession,
  listSessionsByQuiz,
} from '@/platform/persistence/sessionRepository'
import {
  upsertRecent,
  listRecents,
} from '@/platform/persistence/recentRepository'
import { closeDB } from '@/platform/persistence/db'
import type { QuizPackage } from '@/domain/quizTypes'

function makeQuiz(overrides: Partial<QuizPackage> = {}): QuizPackage {
  return {
    schemaVersion: 1,
    id: 'quiz-1',
    name: 'Test Quiz',
    fingerprint: 'abc123',
    importedAt: Date.now(),
    updatedAt: Date.now(),
    questionCount: 3,
    questions: [],
    assets: [],
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

describe('quizRepository', () => {
  it('saves and retrieves a quiz', async () => {
    const quiz = makeQuiz()
    await saveQuiz(quiz)
    const retrieved = await getQuiz('quiz-1')
    expect(retrieved).not.toBeUndefined()
    expect(retrieved!.id).toBe('quiz-1')
    expect(retrieved!.name).toBe('Test Quiz')
  })

  it('returns undefined for missing quiz', async () => {
    const result = await getQuiz('nonexistent')
    expect(result).toBeUndefined()
  })

  it('finds quiz by fingerprint', async () => {
    const quiz = makeQuiz({ fingerprint: 'unique-fp' })
    await saveQuiz(quiz)
    const result = await getQuizByFingerprint('unique-fp')
    expect(result).not.toBeUndefined()
    expect(result!.fingerprint).toBe('unique-fp')
  })

  it('returns undefined for unknown fingerprint', async () => {
    const result = await getQuizByFingerprint('no-such-fp')
    expect(result).toBeUndefined()
  })

  it('lists all quizzes', async () => {
    await saveQuiz(makeQuiz({ id: 'q1', name: 'Quiz 1' }))
    await saveQuiz(makeQuiz({ id: 'q2', name: 'Quiz 2' }))
    const list = await listQuizzes()
    expect(list).toHaveLength(2)
  })

  it('updates an existing quiz', async () => {
    const quiz = makeQuiz()
    await saveQuiz(quiz)
    await updateQuiz({ ...quiz, name: 'Updated' })
    const updated = await getQuiz('quiz-1')
    expect(updated!.name).toBe('Updated')
  })

  it('deletes a quiz and cascades to sessions, assets, recents', async () => {
    await saveQuiz(makeQuiz())
    await saveSession({
      schemaVersion: 1,
      id: 's1',
      quizId: 'quiz-1',
      startedAt: 1000,
      updatedAt: 1000,
      completedAt: null,
      numberOfLearnedQuestions: 0,
      numberOfCorrectAnswers: 0,
      numberOfBadAnswers: 0,
      time: 0,
      reoccurrences: [],
    })
    await saveAsset({
      quizId: 'quiz-1',
      relativePath: 'test.jpg',
      blob: new Blob(['test']),
      mimeType: 'image/jpeg',
      size: 4,
    })
    await upsertRecent('quiz-1')

    await deleteQuiz('quiz-1')

    expect(await getQuiz('quiz-1')).toBeUndefined()
    expect(await listSessionsByQuiz('quiz-1')).toHaveLength(0)
    expect(await getAssetsByQuiz('quiz-1')).toHaveLength(0)
    expect(await listRecents()).toHaveLength(0)
  })

  it('checks quiz existence', async () => {
    expect(await quizExists('quiz-1')).toBe(false)
    await saveQuiz(makeQuiz())
    expect(await quizExists('quiz-1')).toBe(true)
  })
})
