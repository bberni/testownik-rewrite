import { describe, it, expect } from 'vitest'
import { createQuizSession, restoreQuizSession } from '@/domain/quizSession'
import type { Question, SingleQuestionAnswer, CompatibleSaveJson } from '@/domain/quizTypes'

function makeQuestions(count: number): Question[] {
  return Array.from({ length: count }, (_, i) => ({
    tag: `${String(i + 1).padStart(3, '0')}.txt`,
    contentType: 'text' as const,
    content: `Question ${i + 1}`,
    type: 'single' as const,
    answers: [
      {
        id: 0,
        type: 'text' as const,
        content: 'Answer A',
        isCorrect: true,
      },
      {
        id: 1,
        type: 'text' as const,
        content: 'Answer B',
        isCorrect: false,
      },
    ] satisfies SingleQuestionAnswer[],
  }))
}

describe('createQuizSession', () => {
  it('creates session with zeroed counters', () => {
    const questions = makeQuestions(3)
    const session = createQuizSession({
      questions,
      reoccurrencesOnStart: 2,
    })

    expect(session.numberOfQuestions).toBe(3)
    expect(session.numberOfLearnedQuestions).toBe(0)
    expect(session.numberOfCorrectAnswers).toBe(0)
    expect(session.numberOfBadAnswers).toBe(0)
    expect(session.time).toBe(0)
  })

  it('initializes reoccurrences from settings', () => {
    const questions = makeQuestions(5)
    const session = createQuizSession({
      questions,
      reoccurrencesOnStart: 3,
    })

    expect(session.reoccurrences).toHaveLength(5)
    expect(
      session.reoccurrences.every((r) => r.value === 3),
    ).toBe(true)
  })

  it('uses question tags for reoccurrence keys', () => {
    const questions = makeQuestions(2)
    const session = createQuizSession({
      questions,
      reoccurrencesOnStart: 2,
    })

    expect(session.reoccurrences[0]!.tag).toBe('001.txt')
    expect(session.reoccurrences[1]!.tag).toBe('002.txt')
  })

  it('preserves questions in output', () => {
    const questions = makeQuestions(2)
    const session = createQuizSession({
      questions,
      reoccurrencesOnStart: 1,
    })

    expect(session.questions).toHaveLength(2)
    expect(session.questions[0]!.tag).toBe('001.txt')
  })
})

describe('restoreQuizSession', () => {
  it('restores counters from save.json', () => {
    const saveData: CompatibleSaveJson = {
      numberOfQuestions: 5,
      numberOfLearnedQuestions: 2,
      numberOfCorrectAnswers: 10,
      numberOfBadAnswers: 3,
      time: 120000,
      reoccurrences: [
        { tag: '001.txt', value: 0 },
        { tag: '002.txt', value: 0 },
        { tag: '003.txt', value: 2 },
        { tag: '004.txt', value: 1 },
        { tag: '005.txt', value: 3 },
      ],
    }
    const questions = makeQuestions(5)
    const session = restoreQuizSession(saveData, questions)

    expect(session.numberOfQuestions).toBe(5)
    expect(session.numberOfLearnedQuestions).toBe(2)
    expect(session.numberOfCorrectAnswers).toBe(10)
    expect(session.numberOfBadAnswers).toBe(3)
    expect(session.time).toBe(120000)
  })

  it('reattaches fresh questions', () => {
    const saveData: CompatibleSaveJson = {
      numberOfQuestions: 2,
      numberOfLearnedQuestions: 0,
      numberOfCorrectAnswers: 0,
      numberOfBadAnswers: 0,
      time: 0,
      reoccurrences: [
        { tag: '001.txt', value: 2 },
        { tag: '002.txt', value: 2 },
      ],
    }
    const questions = makeQuestions(2)

    // Modify questions to prove fresh copy is used
    questions[0]!.content = 'Modified'
    const session = restoreQuizSession(saveData, questions)
    expect(session.questions[0]!.content).toBe('Modified')
  })

  it('preserves reoccurrences from save.json', () => {
    const saveData: CompatibleSaveJson = {
      numberOfQuestions: 3,
      numberOfLearnedQuestions: 1,
      numberOfCorrectAnswers: 5,
      numberOfBadAnswers: 2,
      time: 300000,
      reoccurrences: [
        { tag: '001.txt', value: 0 },
        { tag: '002.txt', value: 1 },
        { tag: '003.txt', value: 3 },
      ],
    }
    const questions = makeQuestions(3)
    const session = restoreQuizSession(saveData, questions)

    expect(session.reoccurrences).toEqual(saveData.reoccurrences)
  })
})
