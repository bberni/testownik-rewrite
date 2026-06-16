export type AnswerType = 'text' | 'image'

export interface Answer {
  id: number
  type: AnswerType
  content: string
  isCorrect: boolean
}

export type QuestionType = 'single' | 'select'

export type ContentType = 'text' | 'image'

export type QuestionContent =
  | string
  | (string | SelectPlaceholder)[]

export interface SelectPlaceholder {
  selectId: number
  visibleContent: string
}

export interface Question {
  tag: string
  contentType: ContentType
  content: QuestionContent
  type: QuestionType
  answers: SingleQuestionAnswer[] | SelectQuestionAnswer[]
}

export interface SingleQuestionAnswer extends Answer {
  id: number
  type: AnswerType
  content: string
  isCorrect: boolean
}

export interface SelectOption extends Answer {
  id: number
  type: AnswerType
  content: string
  isCorrect: boolean
}

export interface SelectQuestionAnswer {
  id: number
  correctOptionId: number
  options: SelectOption[]
}

export interface QuestionReoccurrence {
  tag: string
  value: number
}

export interface QuizSession {
  id: string
  quizId: string
  startedAt: number
  updatedAt: number
  completedAt: number | null
  numberOfLearnedQuestions: number
  numberOfCorrectAnswers: number
  numberOfBadAnswers: number
  time: number
  reoccurrences: QuestionReoccurrence[]
}

export interface QuizPackage {
  schemaVersion: 1
  id: string
  name: string
  fingerprint: string
  importedAt: number
  updatedAt: number
  questionCount: number
  questions: Question[]
  assets: StoredAssetRef[]
}

export interface StoredAssetRef {
  relativePath: string
  mimeType: string
  size: number
}

export interface AppSettings {
  schemaVersion: 1
  theme: 'dark' | 'light' | 'legacy'
  reoccurrencesIfBad: number
  reoccurrencesOnStart: number
  maxReoccurrences: number
}

export interface CompatibleSaveJson {
  location?: string
  numberOfQuestions: number
  numberOfLearnedQuestions: number
  numberOfCorrectAnswers: number
  numberOfBadAnswers: number
  time: number
  reoccurrences: QuestionReoccurrence[]
}
