import type {
  Question,
  QuestionReoccurrence,
  CompatibleSaveJson,
} from './quizTypes'

export interface NewQuizPayload {
  questions: Question[]
  reoccurrencesOnStart: number
}

export interface CreateQuizSessionResult {
  numberOfQuestions: number
  numberOfLearnedQuestions: number
  numberOfCorrectAnswers: number
  numberOfBadAnswers: number
  time: number
  reoccurrences: QuestionReoccurrence[]
  questions: Question[]
}

/**
 * Creates a new quiz session from parsed questions and settings.
 * Matches legacy quizMaker.prepareQuizObject behavior.
 */
export function createQuizSession(
  payload: NewQuizPayload,
): CreateQuizSessionResult {
  const { questions, reoccurrencesOnStart } = payload
  return {
    numberOfQuestions: questions.length,
    numberOfLearnedQuestions: 0,
    numberOfCorrectAnswers: 0,
    numberOfBadAnswers: 0,
    time: 0,
    reoccurrences: questions.map((q) => ({
      tag: q.tag,
      value: reoccurrencesOnStart,
    })),
    questions,
  }
}

/**
 * Restores a session from a compatible save.json by re-attaching
 * freshly parsed questions to the saved progress state.
 * Matches legacy quizMaker.prepareQuizObjectWithSave behavior.
 */
export function restoreQuizSession(
  saveData: CompatibleSaveJson,
  questions: Question[],
): CreateQuizSessionResult {
  return {
    numberOfQuestions: saveData.numberOfQuestions,
    numberOfLearnedQuestions: saveData.numberOfLearnedQuestions,
    numberOfCorrectAnswers: saveData.numberOfCorrectAnswers,
    numberOfBadAnswers: saveData.numberOfBadAnswers,
    time: saveData.time,
    reoccurrences: saveData.reoccurrences,
    questions,
  }
}
