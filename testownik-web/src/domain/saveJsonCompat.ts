/**
 * Replacements for moment.duration formatting.
 * Formats milliseconds as HH:mm:ss (e.g., 3723000 → "01:02:03").
 */
import type { CompatibleSaveJson, QuestionReoccurrence } from './quizTypes'

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds]
    .map((n) => String(n).padStart(2, '0'))
    .join(':')
}

/**
 * Serializes quiz state to a compatible save.json string.
 * Questions are omitted (matching legacy replacer behavior).
 * Returns the JSON string.
 */
export function serializeSaveJson(
  numberOfQuestions: number,
  numberOfLearnedQuestions: number,
  numberOfCorrectAnswers: number,
  numberOfBadAnswers: number,
  time: number,
  reoccurrences: QuestionReoccurrence[],
): string {
  const data: CompatibleSaveJson = {
    numberOfQuestions,
    numberOfLearnedQuestions,
    numberOfCorrectAnswers,
    numberOfBadAnswers,
    time,
    reoccurrences,
  }
  return JSON.stringify(data, null, 2)
}

/**
 * Parses a compatible save.json string.
 */
export function deserializeSaveJson(json: string): CompatibleSaveJson {
  const data = JSON.parse(json) as CompatibleSaveJson

  if (typeof data.numberOfQuestions !== 'number') {
    throw new Error('Invalid save.json: missing numberOfQuestions')
  }
  if (!Array.isArray(data.reoccurrences)) {
    throw new Error('Invalid save.json: missing reoccurrences array')
  }

  return {
    numberOfQuestions: data.numberOfQuestions,
    numberOfLearnedQuestions: data.numberOfLearnedQuestions ?? 0,
    numberOfCorrectAnswers: data.numberOfCorrectAnswers ?? 0,
    numberOfBadAnswers: data.numberOfBadAnswers ?? 0,
    time: data.time ?? 0,
    reoccurrences: data.reoccurrences,
  }
}
