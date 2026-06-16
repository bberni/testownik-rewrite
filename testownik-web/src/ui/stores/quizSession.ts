import { defineStore } from 'pinia'
import type {
  Question,
  QuizSession,
  SingleQuestionAnswer,
  SelectQuestionAnswer,
} from '@/domain/quizTypes'
import { getQuiz } from '@/platform/persistence/quizRepository'
import {
  saveSession,
  getLatestSession,
} from '@/platform/persistence/sessionRepository'
import { useSettingsStore } from './settings'
import { createQuizSession } from '@/domain/quizSession'
import {
  checkSingleAnswer,
  checkSelectAnswer,
  applyAnswerResult,
  isQuizComplete,
  pickRandomQuestion,
  computeProgress,
} from '@/domain/quizEngine'
import { serializeSaveJson } from '@/domain/saveJsonCompat'
import { triggerDownload } from '@/platform/browser/download'
import { addVisibilityListener } from '@/platform/browser/visibility'

export type QuizPhase = 'answering' | 'revealed' | 'finished'

function shuffleSingleAnswers(
  question: Question | null,
): SingleQuestionAnswer[] {
  if (question?.type !== 'single') return []
  const answerList = question.answers as SingleQuestionAnswer[]
  return [...answerList].sort(() => Math.random() - 0.5)
}

export const useQuizSessionStore = defineStore('quizSession', {
  state: () => ({
    quizId: '',
    quizName: '',
    questions: [] as Question[],
    session: null as QuizSession | null,
    mode: 'new',

    currentTag: null as string | null,
    currentQuestion: null as Question | null,

    selectedIds: [] as number[],
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    selectSelections: {} as Record<number, number>,
    shuffledSingleAnswers: [] as SingleQuestionAnswer[],

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    phase: 'answering' as QuizPhase,
    timerRunning: false,
    timerInterval: null as ReturnType<typeof setInterval> | null,
    timerStartedAt: null as number | null,
    timerTick: 0,
    autosaveInterval: null as ReturnType<typeof setInterval> | null,
    removeVisibilityListener: null as (() => void) | null,

    lastCorrect: false,
    revealedCorrectIds: [] as number[],
    revealedSelectResults: [] as {
      selectId: number
      selectedOptionId: number | null
      correctOptionId: number
      isCorrect: boolean
    }[],
    isAnswerCorrect: false,
  }),

  getters: {
    time(state): number {
      if (!state.session) return 0
      void state.timerTick
      const elapsed = state.timerStartedAt !== null ? Date.now() - state.timerStartedAt : 0
      return state.session.time + elapsed
    },

    currentReoccurrences(state): number {
      if (!state.currentTag) return 0
      const rec = state.session?.reoccurrences.find(
        (r) => r.tag === state.currentTag,
      )
      return rec?.value ?? 0
    },

    progress(state) {
      if (!state.session) {
        return { correctRatio: 0, learnedRatio: 0, totalQuestions: 0 }
      }
      return computeProgress(state.session)
    },

    isSingle(state): boolean {
      return state.currentQuestion?.type === 'single'
    },

    singleAnswers(state): SingleQuestionAnswer[] {
      if (state.currentQuestion?.type !== 'single') {
        return []
      }
      return state.shuffledSingleAnswers
    },

    selectAnswers(state): SelectQuestionAnswer[] {
      if (state.currentQuestion?.type !== 'select') {
        return []
      }
      return state.currentQuestion.answers as SelectQuestionAnswer[]
    },
  },

  actions: {
    async init(quizId: string, mode: 'continue' | 'new') {
      this.quizId = quizId
      this.mode = mode

      const quiz = await getQuiz(quizId)
      if (!quiz) throw new Error('Quiz nie został znaleziony.')
      const quizQuestions: Question[] = quiz.questions

      this.questions = quizQuestions
      this.quizName = quiz.name

      const settings = useSettingsStore()
      let session: QuizSession

      if (mode === 'continue') {
        const existing = await getLatestSession(quizId)
        if (existing?.completedAt !== null) {
          const created = createNewSession()
          await saveSession(created)
          session = created
        } else {
          session = existing
        }
      } else {
        const created = createNewSession()
        await saveSession(created)
        session = created
      }

      this.session = session
      this.pickNext()
      this.startTimer()

      function createNewSession(): QuizSession {
        const created = createQuizSession({
          questions: quizQuestions,
          reoccurrencesOnStart: settings.reoccurrencesOnStart,
        })
        return {
          schemaVersion: 1,
          id: crypto.randomUUID(),
          quizId,
          startedAt: Date.now(),
          updatedAt: Date.now(),
          completedAt: null,
          numberOfLearnedQuestions: created.numberOfLearnedQuestions,
          numberOfCorrectAnswers: created.numberOfCorrectAnswers,
          numberOfBadAnswers: created.numberOfBadAnswers,
          time: created.time,
          reoccurrences: created.reoccurrences,
        }
      }
    },

    pickNext() {
      const tag = pickRandomQuestion(
        this.session!.reoccurrences,
        Math.random,
      )
      if (!tag) {
        this.currentTag = null
        this.currentQuestion = null
        this.phase = 'finished'
        this.stopTimer()
        void this.finishQuiz()
        return
      }

      this.currentTag = tag
      this.currentQuestion =
        this.questions.find((q) => q.tag === tag) ?? null
      this.selectedIds = []
      this.selectSelections = {}
      this.shuffledSingleAnswers = shuffleSingleAnswers(this.currentQuestion)
      this.phase = 'answering'
    },

    toggleAnswer(id: number) {
      if (this.phase !== 'answering') return
      const idx = this.selectedIds.indexOf(id)
      if (idx === -1) {
        this.selectedIds = [...this.selectedIds, id]
      } else {
        this.selectedIds = this.selectedIds.filter((i) => i !== id)
      }
    },

    selectOption(selectId: number, optionId: number) {
      this.selectSelections = {
        ...this.selectSelections,
        [selectId]: optionId,
      }
    },

    checkAnswer() {
      if (!this.currentQuestion || !this.session) return

      let isCorrect: boolean

      if (this.currentQuestion.type === 'single') {
        const answers = this.currentQuestion
          .answers as SingleQuestionAnswer[]
        const correctIds = answers
          .filter((a) => a.isCorrect)
          .map((a) => a.id)
        const result = checkSingleAnswer(correctIds, this.selectedIds)
        isCorrect = result.isCorrect
        this.revealedCorrectIds = result.correctIds
      } else {
        const answers = this.currentQuestion
          .answers as SelectQuestionAnswer[]
      const selections = answers.map((a) => ({
        selectId: a.id,
        selectedOptionId: (this.selectSelections as Record<number, number | null>)[a.id] ?? null,
        correctOptionId: a.correctOptionId,
      }))
        const result = checkSelectAnswer(selections)
        isCorrect = result.isCorrect
        this.revealedSelectResults = selections.map((s) => ({
          selectId: s.selectId,
          selectedOptionId: s.selectedOptionId,
          correctOptionId: s.correctOptionId,
          isCorrect: s.selectedOptionId === s.correctOptionId,
        }))
      }

      this.isAnswerCorrect = isCorrect
      this.phase = 'revealed'

      const settings = useSettingsStore()
      const newState = applyAnswerResult(
        this.session,
        this.currentTag!,
        isCorrect,
        {
          reoccurrencesIfBad: settings.reoccurrencesIfBad,
          maxReoccurrences: settings.maxReoccurrences,
        },
      )

      this.session = {
        ...this.session,
        ...newState,
        updatedAt: Date.now(),
      }

      void this.saveSession()

      if (isQuizComplete(this.session)) {
        this.phase = 'finished'
        this.stopTimer()
        void this.finishQuiz()
      }
    },

    nextQuestion() {
      this.pickNext()
    },

    startTimer() {
      if (this.timerInterval) return
      this.timerRunning = true
      this.timerStartedAt = Date.now()
      this.timerTick = 0
      this.timerInterval = setInterval(() => {
        this.timerTick++
      }, 1000)
      this.autosaveInterval = setInterval(() => {
        void this.saveSession({ silent: true })
      }, 30000)
      this.removeVisibilityListener = addVisibilityListener((hidden) => {
        if (hidden) {
          void this.saveSession({ silent: true })
        }
      })
    },

    stopTimer() {
      this.timerRunning = false
      if (this.timerStartedAt !== null && this.session) {
        this.session = {
          ...this.session,
          time: this.session.time + (Date.now() - this.timerStartedAt),
        }
      }
      this.timerStartedAt = null
      this.timerTick = 0
      if (this.timerInterval) {
        clearInterval(this.timerInterval)
        this.timerInterval = null
      }
      if (this.autosaveInterval) {
        clearInterval(this.autosaveInterval)
        this.autosaveInterval = null
      }
      if (this.removeVisibilityListener) {
        this.removeVisibilityListener()
        this.removeVisibilityListener = null
      }
    },

    flushTime() {
      if (this.timerStartedAt !== null && this.session) {
        this.session = {
          ...this.session,
          time: this.session.time + (Date.now() - this.timerStartedAt),
        }
        this.timerStartedAt = Date.now()
      }
    },

    async finishQuiz() {
      if (!this.session) return
      this.session = {
        ...this.session,
        completedAt: Date.now(),
        updatedAt: Date.now(),
      }
      this.stopTimer()
      await this.saveSession()
    },

    async saveSession(options?: { silent?: boolean }) {
      if (!this.session) return
      this.flushTime()
      try {
        await saveSession(this.session)
      } catch (e) {
        if (!options?.silent) {
          console.error('Failed to save quiz session:', e)
        }
      }
    },

    exportSaveJson(): void {
      if (!this.session) return
      const json = serializeSaveJson(
        this.questions.length,
        this.session.numberOfLearnedQuestions,
        this.session.numberOfCorrectAnswers,
        this.session.numberOfBadAnswers,
        this.session.time,
        this.session.reoccurrences,
      )
      triggerDownload('save.json', json)
    },
  },
})
