import { describe, it, expect } from 'vitest'
import {
  checkSingleAnswer,
  checkSelectAnswer,
  applyAnswerResult,
  isQuizComplete,
  pickRandomQuestion,
  computeProgress,
} from '@/domain/quizEngine'
import type { EngineSettings, QuizState } from '@/domain/quizEngine'

const defaultSettings: EngineSettings = {
  reoccurrencesIfBad: 0,
  maxReoccurrences: 10,
}

function makeState(
  overrides: Partial<QuizState> = {},
): QuizState {
  return {
    numberOfLearnedQuestions: 0,
    numberOfCorrectAnswers: 0,
    numberOfBadAnswers: 0,
    time: 0,
    reoccurrences: [
      { tag: '001.txt', value: 2 },
      { tag: '002.txt', value: 2 },
      { tag: '003.txt', value: 2 },
    ],
    ...overrides,
  }
}

describe('checkSingleAnswer', () => {
  it('returns correct for matching single answer', () => {
    const result = checkSingleAnswer([0, 1], [1, 0])
    expect(result.isCorrect).toBe(true)
  })

  it('returns correct for exact order match', () => {
    const result = checkSingleAnswer([0, 1], [0, 1])
    expect(result.isCorrect).toBe(true)
  })

  it('returns incorrect for mismatched IDs', () => {
    const result = checkSingleAnswer([0], [1])
    expect(result.isCorrect).toBe(false)
  })

  it('returns incorrect when user selects extra answers', () => {
    const result = checkSingleAnswer([0], [0, 1])
    expect(result.isCorrect).toBe(false)
  })

  it('returns incorrect when user misses correct answers', () => {
    const result = checkSingleAnswer([0, 1], [0])
    expect(result.isCorrect).toBe(false)
  })

  it('returns correct for no correct and no selected (edge case)', () => {
    const result = checkSingleAnswer([], [])
    expect(result.isCorrect).toBe(true)
  })
})

describe('checkSelectAnswer', () => {
  it('returns correct when all selects match', () => {
    const result = checkSelectAnswer([
      { selectId: 0, selectedOptionId: 1, correctOptionId: 1 },
      { selectId: 1, selectedOptionId: 0, correctOptionId: 0 },
    ])
    expect(result.isCorrect).toBe(true)
  })

  it('returns incorrect when any select mismatches', () => {
    const result = checkSelectAnswer([
      { selectId: 0, selectedOptionId: 1, correctOptionId: 1 },
      { selectId: 1, selectedOptionId: 2, correctOptionId: 0 },
    ])
    expect(result.isCorrect).toBe(false)
  })

  it('returns incorrect with null selection', () => {
    const result = checkSelectAnswer([
      { selectId: 0, selectedOptionId: null, correctOptionId: 0 },
    ])
    expect(result.isCorrect).toBe(false)
  })
})

describe('applyAnswerResult', () => {
  it('increments correct count and decrements reoccurrence on correct', () => {
    const state = makeState()
    const result = applyAnswerResult(state, '001.txt', true, defaultSettings)

    expect(result.numberOfCorrectAnswers).toBe(1)
    expect(result.numberOfBadAnswers).toBe(0)
    expect(result.numberOfLearnedQuestions).toBe(0)
    expect(result.reoccurrences[0]!.value).toBe(1)
  })

  it('increments bad count and increases reoccurrence on incorrect', () => {
    const settings: EngineSettings = {
      reoccurrencesIfBad: 2,
      maxReoccurrences: 10,
    }
    const state = makeState()
    const result = applyAnswerResult(state, '001.txt', false, settings)

    expect(result.numberOfCorrectAnswers).toBe(0)
    expect(result.numberOfBadAnswers).toBe(1)
    expect(result.numberOfLearnedQuestions).toBe(0)
    expect(result.reoccurrences[0]!.value).toBe(4)
  })

  it('increments learned count when reoccurrence reaches zero', () => {
    const state = makeState({
      reoccurrences: [{ tag: '001.txt', value: 1 }],
    })
    const result = applyAnswerResult(state, '001.txt', true, defaultSettings)

    expect(result.numberOfLearnedQuestions).toBe(1)
    expect(result.reoccurrences[0]!.value).toBe(0)
  })

  it('caps reoccurrence at maxReoccurrences', () => {
    const settings: EngineSettings = {
      reoccurrencesIfBad: 5,
      maxReoccurrences: 7,
    }
    const state = makeState({
      reoccurrences: [{ tag: '001.txt', value: 5 }],
    })
    const result = applyAnswerResult(state, '001.txt', false, settings)

    expect(result.reoccurrences[0]!.value).toBe(7)
  })

  it('does not modify other reoccurrences', () => {
    const state = makeState()
    const result = applyAnswerResult(state, '001.txt', true, defaultSettings)

    expect(result.reoccurrences[1]!.value).toBe(2)
    expect(result.reoccurrences[2]!.value).toBe(2)
  })

  it('returns unchanged state if tag not found', () => {
    const state = makeState()
    const result = applyAnswerResult(
      state,
      'nonexistent.txt',
      true,
      defaultSettings,
    )

    expect(result.numberOfCorrectAnswers).toBe(0)
    expect(result.reoccurrences[0]!.value).toBe(2)
  })
})

describe('isQuizComplete', () => {
  it('returns false when reoccurrences remain', () => {
    const state = makeState({
      reoccurrences: [{ tag: '001.txt', value: 1 }],
    })
    expect(isQuizComplete(state)).toBe(false)
  })

  it('returns true when all reoccurrences are zero', () => {
    const state = makeState({
      reoccurrences: [{ tag: '001.txt', value: 0 }],
    })
    expect(isQuizComplete(state)).toBe(true)
  })

  it('returns true for empty reoccurrences', () => {
    const state = makeState({ reoccurrences: [] })
    expect(isQuizComplete(state)).toBe(true)
  })
})

describe('pickRandomQuestion', () => {
  it('returns null when no reoccurrences remain', () => {
    const reoccurrences = [{ tag: '001.txt', value: 0 }]
    const rng = () => 0.5
    expect(pickRandomQuestion(reoccurrences, rng)).toBeNull()
  })

  it('picks a question from remaining ones', () => {
    const reoccurrences = [
      { tag: '001.txt', value: 1 },
      { tag: '002.txt', value: 2 },
    ]
    const rng = () => 0
    expect(pickRandomQuestion(reoccurrences, rng)).toBe('001.txt')
  })

  it('uses RNG to select (deterministic)', () => {
    const reoccurrences = [
      { tag: '001.txt', value: 1 },
      { tag: '002.txt', value: 1 },
    ]
    const rng = () => 0.99
    expect(pickRandomQuestion(reoccurrences, rng)).toBe('002.txt')
  })

  it('skips zero-value reoccurrences', () => {
    const reoccurrences = [
      { tag: '001.txt', value: 0 },
      { tag: '002.txt', value: 1 },
    ]
    const rng = () => 0
    expect(pickRandomQuestion(reoccurrences, rng)).toBe('002.txt')
  })
})

describe('computeProgress', () => {
  it('returns zero ratios for initial state', () => {
    const state = makeState()
    const progress = computeProgress(state)
    expect(progress.correctRatio).toBe(0)
    expect(progress.learnedRatio).toBe(0)
  })

  it('computes correct ratio', () => {
    const state = makeState({
      numberOfCorrectAnswers: 3,
      numberOfBadAnswers: 7,
    })
    const progress = computeProgress(state)
    expect(progress.correctRatio).toBe(0.3)
  })

  it('computes learned ratio', () => {
    const state = makeState({
      numberOfLearnedQuestions: 2,
      reoccurrences: [
        { tag: '001.txt', value: 0 },
        { tag: '002.txt', value: 0 },
        { tag: '003.txt', value: 1 },
      ],
    })
    const progress = computeProgress(state)
    expect(progress.learnedRatio).toBe(2 / 3)
  })
})
