export interface EngineSettings {
  reoccurrencesIfBad: number
  maxReoccurrences: number
}

export interface QuizState {
  numberOfLearnedQuestions: number
  numberOfCorrectAnswers: number
  numberOfBadAnswers: number
  time: number
  reoccurrences: { tag: string; value: number }[]
}

export interface CheckSingleResult {
  isCorrect: boolean
  correctIds: number[]
}

export interface CheckSelectResult {
  isCorrect: boolean
  selections: { selectId: number; selectedOptionId: number | null; correctOptionId: number }[]
}

/**
 * Checks a single (checkbox) answer.
 * Takes the correct answer IDs and the user's selected answer IDs.
 * Both are sorted for order-independent comparison.
 */
export function checkSingleAnswer(
  correctIds: number[],
  selectedIds: number[],
): CheckSingleResult {
  const sortedCorrect = [...correctIds].sort((a, b) => a - b)
  const sortedSelected = [...selectedIds].sort((a, b) => a - b)
  const isCorrect =
    sortedCorrect.length === sortedSelected.length &&
    sortedCorrect.every((id, i) => id === sortedSelected[i])

  return { isCorrect, correctIds: sortedCorrect }
}

/**
 * Checks a select (dropdown) answer.
 * Every select must have its selectedOptionId match the correctOptionId.
 */
export function checkSelectAnswer(
  selections: {
    selectId: number
    selectedOptionId: number | null
    correctOptionId: number
  }[],
): CheckSelectResult {
  const isCorrect = selections.every(
    (s) => s.selectedOptionId === s.correctOptionId,
  )
  return { isCorrect, selections }
}

/**
 * Applies the answer result to the quiz state, updating counters
 * and reoccurrences. Returns a new state (immutable-style).
 * Matches legacy Quiz.vue checkUserAnswer logic.
 */
export function applyAnswerResult(
  state: QuizState,
  questionTag: string,
  isCorrect: boolean,
  settings: EngineSettings,
): QuizState {
  const reoccurrences = state.reoccurrences.map((r) =>
    r.tag === questionTag ? { ...r } : r,
  )
  const match = reoccurrences.find((r) => r.tag === questionTag)
  if (!match) return { ...state, reoccurrences }

  let numberOfCorrectAnswers = state.numberOfCorrectAnswers
  let numberOfBadAnswers = state.numberOfBadAnswers
  let numberOfLearnedQuestions = state.numberOfLearnedQuestions

  if (isCorrect) {
    numberOfCorrectAnswers++
    match.value--
    if (match.value === 0) {
      numberOfLearnedQuestions++
    }
  } else {
    numberOfBadAnswers++
    match.value += settings.reoccurrencesIfBad
    if (match.value > settings.maxReoccurrences) {
      match.value = settings.maxReoccurrences
    }
  }

  return {
    numberOfLearnedQuestions,
    numberOfCorrectAnswers,
    numberOfBadAnswers,
    time: state.time,
    reoccurrences,
  }
}

/**
 * Returns whether the quiz is finished (no remaining reoccurrences > 0).
 */
export function isQuizComplete(state: QuizState): boolean {
  return state.reoccurrences.every((r) => r.value <= 0)
}

/**
 * Picks a random remaining question tag. Uses an injected RNG for testability.
 * Returns null if no questions remain.
 */
export function pickRandomQuestion(
  reoccurrences: { tag: string; value: number }[],
  rng: () => number,
): string | null {
  const remaining = reoccurrences.filter((r) => r.value > 0)
  if (remaining.length === 0) return null
  const index = Math.floor(rng() * remaining.length)
  return remaining[index]!.tag
}

/**
 * Computes progress ratios for display.
 */
export function computeProgress(state: QuizState): {
  correctRatio: number
  learnedRatio: number
  totalQuestions: number
} {
  const total =
    state.numberOfCorrectAnswers + state.numberOfBadAnswers
  return {
    correctRatio: total === 0 ? 0 : state.numberOfCorrectAnswers / total,
    learnedRatio:
      state.reoccurrences.length === 0
        ? 0
        : state.numberOfLearnedQuestions / state.reoccurrences.length,
    totalQuestions: state.reoccurrences.length,
  }
}
