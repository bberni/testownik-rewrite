import { describe, it, expect } from 'vitest'
import {
  serializeSaveJson,
  deserializeSaveJson,
} from '@/domain/saveJsonCompat'
import type { QuestionReoccurrence } from '@/domain/quizTypes'

const sampleReoccurrences: QuestionReoccurrence[] = [
  { tag: '001.txt', value: 0 },
  { tag: '002.txt', value: 2 },
  { tag: '003.txt', value: 1 },
]

describe('serializeSaveJson', () => {
  it('produces valid JSON', () => {
    const json = serializeSaveJson(3, 1, 5, 2, 120000, sampleReoccurrences)
    const data = deserializeSaveJson(json)
    expect(data.numberOfQuestions).toBe(3)
  })

  it('omits questions from output', () => {
    const json = serializeSaveJson(3, 1, 5, 2, 120000, sampleReoccurrences)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsed = JSON.parse(json)
    expect(parsed).not.toHaveProperty('questions')
  })

  it('matches compatible save.json shape', () => {
    const json = serializeSaveJson(
      10,
      3,
      25,
      7,
      7200000,
      sampleReoccurrences,
    )
    const data = deserializeSaveJson(json)

    expect(data).toMatchObject({
      numberOfQuestions: 10,
      numberOfLearnedQuestions: 3,
      numberOfCorrectAnswers: 25,
      numberOfBadAnswers: 7,
      time: 7200000,
    })
    expect(data.reoccurrences).toEqual(sampleReoccurrences)
  })
})

describe('deserializeSaveJson', () => {
  it('parses valid save.json', () => {
    const json = JSON.stringify({
      numberOfQuestions: 5,
      numberOfLearnedQuestions: 2,
      numberOfCorrectAnswers: 10,
      numberOfBadAnswers: 3,
      time: 300000,
      reoccurrences: sampleReoccurrences,
    })
    const data = deserializeSaveJson(json)

    expect(data.numberOfQuestions).toBe(5)
    expect(data.numberOfLearnedQuestions).toBe(2)
    expect(data.numberOfCorrectAnswers).toBe(10)
    expect(data.numberOfBadAnswers).toBe(3)
    expect(data.time).toBe(300000)
    expect(data.reoccurrences).toEqual(sampleReoccurrences)
  })

  it('handles missing optional fields with defaults', () => {
    const json = JSON.stringify({
      numberOfQuestions: 3,
      reoccurrences: [],
    })
    const data = deserializeSaveJson(json)

    expect(data.numberOfLearnedQuestions).toBe(0)
    expect(data.numberOfCorrectAnswers).toBe(0)
    expect(data.numberOfBadAnswers).toBe(0)
    expect(data.time).toBe(0)
  })

  it('throws on invalid JSON', () => {
    expect(() => deserializeSaveJson('{invalid}')).toThrow()
  })

  it('throws when missing numberOfQuestions', () => {
    expect(() =>
      deserializeSaveJson(
        JSON.stringify({ reoccurrences: [] }),
      ),
    ).toThrow('numberOfQuestions')
  })

  it('throws when missing reoccurrences array', () => {
    expect(() =>
      deserializeSaveJson(
        JSON.stringify({ numberOfQuestions: 5 }),
      ),
    ).toThrow('reoccurrences')
  })

  it('round-trips: serialize then deserialize', () => {
    const json = serializeSaveJson(4, 1, 8, 2, 60000, sampleReoccurrences)
    const data = deserializeSaveJson(json)

    expect(data.numberOfQuestions).toBe(4)
    expect(data.numberOfLearnedQuestions).toBe(1)
    expect(data.reoccurrences).toEqual(sampleReoccurrences)
  })
})
