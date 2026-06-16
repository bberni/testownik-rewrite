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

  it('deletes a quiz and cascades', async () => {
    await saveQuiz(makeQuiz())
    await deleteQuiz('quiz-1')
    const result = await getQuiz('quiz-1')
    expect(result).toBeUndefined()
  })

  it('checks quiz existence', async () => {
    expect(await quizExists('quiz-1')).toBe(false)
    await saveQuiz(makeQuiz())
    expect(await quizExists('quiz-1')).toBe(true)
  })
})
